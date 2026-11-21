
import { User } from "../Database/indexDb.js";
import { parse } from "cookie";
import jwt from 'jsonwebtoken';

function socketAuth(io){

io.use(async (socket, next) => {

        try {

            // 1. Get the cookie header.
            const cookieHeader = socket.handshake.headers.cookie;

            console.log(cookieHeader)

            // 2. Parse the cookies.
            const cookies = parse(cookieHeader || "");

            // 3. Extract the JWT.
            console.log(cookies);
            const token = cookies.token; // Replace jwt with your actual cookie name.

            if (!token) {
                return next(new Error("Authentication required"));
            }

            // 4. Verify the JWT.
            const decoded = jwt.verify(
                token,
                process.env.JWT_KEY
            );

            // 5. Attach authenticated user information to socket.
            socket.user = decoded.UserId;
            console.log(decoded)
            const user = await User.findByPk(decoded.UserId);
            if(!user){
                next(new Error("Invalid or expired token"));
            }

            next();

        } catch (err) {

            console.error("Socket authentication failed:", err.message);

            next(new Error("Invalid or expired token"));

        }

    });
}

export {socketAuth};