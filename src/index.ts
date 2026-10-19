import http from 'node:http'
import {createServerApplication} from './app/index.js'

async function main() {
    try {
        const server = http.createServer(createServerApplication());
        const PORT = 3000;
        server.listen(PORT, () => {
            console.log(`server listen on port : ${PORT}`);
        })
    } catch (error) {
        throw error;
    }
}

main().catch(err => {
    console.error(" server start failed : ",err);
})