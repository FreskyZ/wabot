import { API } from './index.mjs';
import type { CQMessageEvent } from './types.mjs';

export class EchoPlugin {
    public constructor(
        private readonly api: API,
    ) {
        const atme = `[CQ:at,qq=${api.selfid}] `;
        api.on('message', (message: CQMessageEvent) => {
            if (message.message.startsWith(atme)) {
                api.send_group_message(api.groupid, `[CQ:at,qq=${message.user_id}] ${message.message.substring(atme.length)}`);
            }
        });
    }
}
