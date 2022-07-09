import { WebSocket, WebSocketServer } from 'ws';
import { start as replstart } from 'node:repl';

interface CQEvent {
    time: number,
    self_id: number,
    post_type: 'message' | 'request' | 'notice' | 'meta_event',
    request_type?: string, // only when request
    notice_type?: string,  // only when notice
    // follows only when message
    // not a tagged union because other types are simple and not used
    message_type: 'group' | 'private',
    sub_type: 'friend' | 'group' | 'group_self' | 'other' | 'normal' | 'anonymous' | 'notice',
    message_id: number,
    user_id: number,
    message: any,
    raw_message: string,
    font: number,
    group_id: number,
    sender: MessageSender,
}

interface MessageSender {
    user_id: number,
    nickname: string,
    sex: string,
    age: number,
    card?: string, // nickname in group
    area?: string,
    level?: string,
    role?: string,
    title?: string,
}

let socket: WebSocket;
function tome(content: string) {
    socket.send(JSON.stringify({
        action: 'send_private_msg',
        params: {
            user_id: /* config.ADMINID */ 0,
            message: content,
        },
        echo: 'tome',
    }));
}
function togroup(content: string) {
    socket.send(JSON.stringify({
        action: 'send_group_msg',
        params: {
            group_id: /* config.GROUPID */ 0,
            message: content,
        },
        echo: 'togroup',
    }));
}

const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', ws => {
    socket = ws;
    ws.on('message', (data: ArrayBuffer) => {
        const event = JSON.parse(Buffer.from(data).toString()) as CQEvent;
        if (event.post_type == 'meta_event') {
            // console.log('HEARTBEAT, I THINK');
        } else if (event.post_type == 'request') {
            console.log('REQUEST', event);
        } else if (event.post_type == 'notice') {
            console.log('NOTICE', event);
        } else {
            console.log('MESSAGE', event);
        }
    });
    tome('起！');
});

const repl = replstart('> ');
repl.defineCommand('tome', tome);
repl.defineCommand('togroup', togroup);

console.log('wabot start');
