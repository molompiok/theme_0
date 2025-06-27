//pages/stores/StoreStore.ts
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { ListType } from "../Interfaces/Interfaces";

import { Transmit } from '@adonisjs/transmit-client'
import { Data } from "../../renderer/AppStore/Data";

export { getTransmit }

let transmit: Transmit | null = null;
let baseUrl = ''
function getTransmit(url: string): Transmit | null {
    if (baseUrl == url && transmit) return transmit;
    transmit?.close();
    baseUrl = url;
    if (!url) return null
    console.log(url);

    const host = (process.env.NODE_ENV == 'production' ? 'https://' : 'http://');
    url = (!url.startsWith('http') ? host : '') + url
    transmit = new Transmit({
        baseUrl: url,
        uidGenerator() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0
                const v = c === 'x' ? r : (r & 0x3) | 0x8
                return v.toString(16)
            })
        }
    })

    return transmit
}