import axios from "axios";

const myaxios = axios.create({
    // baseURL: '/api',
    baseURL: 'http://101.254.99.130:55010',
    withCredentials: true
})

export default myaxios
