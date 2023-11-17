import axios from "axios"

const url = process.env.NODE_ENV === "production" ? "https://bytepit.cloud" : "http://localhost:8000"

const instance = axios.create({
    baseURL: url,
})

instance.defaults.withCredentials = true

export default instance
