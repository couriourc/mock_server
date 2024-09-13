import Cors from "@elysiajs/cors";


export default function ({app, option}) {
    app.use(Cors({
        ...(option ?? {})
    }));
}
