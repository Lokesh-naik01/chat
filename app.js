const { SSL_OP_NO_TICKET } = require('constants');
const e = require('express');
var express=require('express');
var app=express();
var server=require('http').createServer(app);
var io=require('socket.io')(server);
var mongoose=require('mongoose');
var users={};
server.listen(3000);
mongoose.connect('mongodb+srv://lokesh:lokesh@cluster0.jso4p.mongodb.net/chatapp?retryWrites=true&w=majority',{useNewUrlParser:true},{useUnifiedTopology: true});
var conn=mongoose.conection;
var chatSchema=mongoose.Schema({
    nick:String,
    msg:String,
    created:{type:Date,default:Date.now}
});
var Chat=mongoose.model('Message',chatSchema);
// app.get('/',function(req,res){
//     res.sendFile(__dirname+'/index.html');
// });
app.set("view engine","ejs");
app.get('/',(req,res)=>{
    res.render('index',{title:"Chat"});
})
io.sockets.on('connection',function(socket){
    console.log(socket.id);
    Chat.find({},function(err,docs){
        if(err) throw err;
        socket.emit('load old msgs',docs);
    });
    socket.on('new user',function(data,callback){
        if(data in users){
            callback(false);
        }
        else{
            callback(true);
            socket.nickname=data;
            users[socket.nickname]=socket;
            updateNicknames();
        }
    });

    function updateNicknames(){
        io.sockets.emit('usernames',Object.keys(users));
    }

    socket.on('send message',function(data,callback){
        var msg=data.trim();
        if(msg.substr(0,3)==='/w '){
            
            msg=msg.substr(3);
            var ind=msg.indexOf(' ');
            if(ind!=-1){
                var name=msg.substring(0,ind);
                var msg=msg.substring(ind+1);
                if(name in users){
                    users[name].emit('whisper',{msg:msg,nick:socket.nickname});
                    console.log('whisper');
                }
                else{
                    callback('enter valid user');
                }
            }
            else{
                callback('Enter msg');
            }
        }
        else{
            var mewMsg=new Chat({
                nick:socket.nickname,
                msg:msg
            });
            mewMsg.save(function(err){
                if(err) throw err;
                io.sockets.emit('new message',{msg:msg,nick:socket.nickname});
            });
        }
    });

    socket.on('disconnect',function(data){
        if(!socket.nickname) return;
        delete users[socket.nickname];
        updateNicknames();
    });

    
});