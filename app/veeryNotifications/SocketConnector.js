/**
 * Created by Veery Team on 4/26/2016.
 */

/* global io */

var notificationMod = angular.module('veeryNotificationMod', []);
notificationMod.factory('notificationConnector', function (socketFactory) {

    var socket, ioSocket, isAuthenticated,
        self = {
            getAuthenticated: function () {
                return isAuthenticated;
            }
        };
    // by default the socket property is null and is not authenticated
    self.socket = socket;
    // initializer function to connect the socket for the first time after logging in to the app
    self.initialize = function (authToken, notificationBaseUrl, notificationEvent) {

        try {
            console.log('initializing socket');

            isAuthenticated = false;

            // socket.io now auto-configures its connection when we omit a connection url
            ioSocket = io(notificationBaseUrl, {
                path: ''
            });

            //call btford angular-socket-io library factory to connect to server at this point
            self.socket = socket = socketFactory({
                ioSocket: ioSocket
            });

            //---------------------
            //these listeners will only be applied once when socket.initialize is called
            //they will be triggered each time the socket connects/re-connects (e.g. when logging out and logging in again)
            //----------------------
            socket.on('authenticated', function () {
                isAuthenticated = true;
                console.log('socket is jwt authenticated');
                if (notificationEvent.onAgentAuthenticated) {
                    notificationEvent.onAgentAuthenticated();
                }
                //document.getElementById("lblNotification").innerHTML = "socket is jwt authenticated";
                /* Notification.success({
                 message: "Register With Notification Provider.",
                 delay: 500,
                 closeOnClick: true
                 });*/
            });
            //---------------------
            socket.on('connect', function () {
                //Notification.info({message: "sending JWT", delay: 500, closeOnClick: true});
                //send the jwt
                socket.emit('authenticate', {token: authToken});
            });

            socket.on('clientdetails', function (data) {
                //Notification.info({message: data, delay: 500, closeOnClick: true});
                //console.log(data);
            });

            socket.on('disconnect', function (reason) {
                //Notification.info({message: reason, delay: 500, closeOnClick: true});
                console.log(reason);

                isAuthenticated = false;
                if (notificationEvent.onAgentDisconnected)
                    notificationEvent.onAgentDisconnected();

            });

            socket.on('message', function (data) {
                if (notificationEvent.OnMessageReceived)
                    notificationEvent.OnMessageReceived(data);
            });

            socket.on('broadcast', function (data) {
                //document.getElementById("lblNotification").innerHTML = data;
                //Notification.info({message: data, delay: 500, closeOnClick: true});
                //console.log(data);
            });

            socket.on('publish', function (data) {
                //document.getElementById("lblNotification").innerHTML = data;
                //Notification.info({message: data, delay: 500, closeOnClick: true});
                //console.log(data);
            });

            socket.on('agent_connected', function (data) {
                //document.getElementById("lblNotification").innerHTML = data.Message;

                //Notification.primary({message: data.Message, delay: 5000, closeOnClick: true});

            });
            socket.on('agent_found', function (data) {
                //var displayMsg = "Company : " + data.Company + "<br> Company No : " + values[5] + "<br> Caller : " + values[3] + "<br> Skill : " + values[6];
                if (notificationEvent.onAgentFound)
                    notificationEvent.onAgentFound(data);
                console.log("Agent found data " + data);
            });

            socket.on('agent_disconnected', function (data) {
                // document.getElementById("lblNotification").innerHTML = data.Message;
                //Notification.primary({message: data.Message, delay: 5000, closeOnClick: true});

            });

            socket.on('todo_reminder', function (data) {
                // document.getElementById("lblNotification").innerHTML = data.Message;
                //Notification.primary({message: data.Message, delay: 5000, closeOnClick: true});
                if (notificationEvent.onToDoRemind)
                    notificationEvent.onToDoRemind(data);
                console.log("onToDoRemind data " + data);


            });
        } catch (ex) {
            console.error("Error In socket.io"+ex);
        }
    };



    self.SocDisconnect = function () {

        if(socket) {


            //socket.removeAllListeners();
            socket.disconnect();
            //delete socket;
            //socket = undefined;

        }
    };
    self.SocReconnect = function () {

        socket.connect();
    }

    return self;

});

notificationMod.factory('veeryNotification', function (notificationConnector, $q) {

    return {
        connectToServer: function (authToken, notificationBaseUrl, notificationEvent) {

            var listenForAuthentication = function () {
                console.log('listening for socket authentication');
                var listenDeferred = $q.defer();
                var authCallback = function () {
                    console.log('listening for socket authentication - done');
                    listenDeferred.resolve(true);
                };
                notificationConnector.socket.on('authenticated', authCallback);
                return listenDeferred.promise;
            };

            if (!notificationConnector.socket) {
                notificationConnector.initialize(authToken, notificationBaseUrl, notificationEvent);
                return listenForAuthentication();
            } else {
                if (notificationConnector.getAuthenticated()) {
                    return $q.when(true);
                } else {

                    notificationConnector.initialize(authToken, notificationBaseUrl, notificationEvent);
                    return listenForAuthentication();
                }
            }
        },

        disconnectFromServer: function() {


            notificationConnector.SocDisconnect();
        },
        reconnectToServer: function() {


            notificationConnector.SocReconnect();
        }

    };
});

agentApp.factory("notificationService", function ($http, baseUrls, authService) {

    var sendNotification = function (notificationData, eventName, eventUuid) {
        var authToken = authService.GetToken();

        return $http({
            method: 'POST',
            url: baseUrls.notification + "/DVP/API/1.0.0.0/NotificationService/Notification/initiate",
            headers: {
                'Content-Type': 'application/json',
                'eventname': eventName,
                'eventuuid': eventUuid
            },
            data: notificationData
        }).then(function (response) {
            return response;
        });
    };

    var broadcastNotification = function (notificationData) {
        var authToken = authService.GetToken();

        return $http({
            method: 'POST',
            url: baseUrls.notification + "/DVP/API/1.0.0.0/NotificationService/Notification/Broadcast",
            data: notificationData
        }).then(function (response) {
            return response;
        });
    };


    return {
        sendNotification: sendNotification,
        broadcastNotification: broadcastNotification

    }
});