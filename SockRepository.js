const Rx = require('rxjs');
const socketio = require('socket.io');
let rosFactory = require('rosie').Factory;
let nanoid = require('nanoid');
let random = require('random-js')();

//適当なデモモデルを作成してマッピング
rosFactory.define('myData')
    .sequence('uniqueId')
    .attr('StatusId', function () { return random.integer(1, 100); })
    .attr('ReqId', function () { return nanoid(16); })
    .attr('ServiceCode', function () { return nanoid(16); })
    .attr('Created_at', function () { return new Date(); });

let SockRepository = function (server) {
    this.server = server;
    this.io = null;
    this.observer = null;
    this.observerArray = null;
    this.socket = null;
};
SockRepository.prototype.listen = function () {
    let vm = this;
    this.io = socketio.listen(this.server);
    this.io.sockets.on('connection', function(socket) {
        vm.socket = socket;
        helloEmit(socket);
        sendMessageOn(socket);
        startSendDataOn(vm, socket);
        startSendDataArrayOn(vm, socket);
        stopSendDataOn(vm, socket);
        stopSendDataArrayOn(vm, socket);
    });
};
function helloEmit(socket) {
    socket.emit('hello', {
        msg: 'Hello from Server!',
        status: 'Connected.'
    });
}
function sendMessageOn(socket) {
    socket.on('sendMessage', function(data) {
        console.log('From client: ' + data.msg);
    });
}
function startSendDataOn(vm, socket){
    socket.on('startSendData', function(data) {
        vm.observerArray = Rx.Observable.interval(10000)
            .subscribe(x => {
                //TODO:ここでのビルドを、例えばRedisから取得してきたオブジェクトを流すとかにする
                socket.emit('myData', rosFactory.build('myData'));
            });
    });
}
function startSendDataArrayOn(vm, socket){
    socket.on('startSendDataArray', function(data) {
        vm.observerArray = Rx.Observable.interval(10000)
            .subscribe(x => {
                //配列にする
                resData = [];
                resData.push(rosFactory.build('myData'));
                resData.push(rosFactory.build('myData'));
                resData.push(rosFactory.build('myData'));
                resData.push(rosFactory.build('myData'));
                resData.push(rosFactory.build('myData'));
                resData.push(rosFactory.build('myData'));
                resData.push(rosFactory.build('myData'));
                resData.push(rosFactory.build('myData'));

                //TODO:ここでのビルドを、例えばRedisから取得してきたオブジェクトを流すとかにする
                socket.emit('myDataArray', resData);
                // socket.emit('myData', rosFactory.build('myData'));
            });
    });
}
function stopSendDataOn(vm, socket){
    socket.on('stopSendData', function(data) {
        if(vm.observer){
            vm.observer.unsubscribe();
            vm.observer = null;
        }
    });
}
function stopSendDataArrayOn(vm, socket){
    socket.on('stopSendDataArray', function(data) {
        if(vm.observerArray){
            vm.observerArray.unsubscribe();
            vm.observerArray = null;
        }
    });
}
module.exports = SockRepository;