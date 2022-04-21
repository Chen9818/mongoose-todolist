const http = require('http')
const mongoose = require('mongoose')
const Posts = require('./model/posts')
const handleSuccess = require('./handleSuccess')
const handleError = require('./handleError')
const headers = require('./headers')
const dotenv = require('dotenv')

dotenv.config({path:"./config.env"})

const DB = process.env.DATABASE.replace(
    '<password>',
    process.env.DATABASE_PASSWORD
)

// 連接資料庫
mongoose.connect(DB)
    .then(()=>{
        console.log('資料庫連線成功')
    })
    .catch((error)=>{
        console.log(error)
    })

const requestListener = async(req,res)=>{
    let body = ''
    req.on('data',chunk => {
        body+=chunk
    })
    const headers = {
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PATCH, POST, GET, OPTIONS, DELETE',
        'Content-Type': 'application/json'
    }
    if(req.url == '/posts' && req.method == 'GET'){
        const posts = await Posts.find()
        handleSuccess(res, posts)
    }else if(req.url == '/posts' && req.method == 'POST'){
        req.on('end',async() => {
            try{
                const data = JSON.parse(body)
                console.log(data);
                const newPost = await Posts.create({
                    name: data.name,
                    tags:data.tags,
                    type: data.type,
                    content:data.content
                })
                handleSuccess(res, newPost)
            }catch(err){
                handleError(res,err)
            }
        })
    }else if(req.url == '/posts' && req.method == 'DELETE'){
        const posts = await Posts.deleteMany({})
        handleSuccess(res, posts)
    }else if(req.url.startsWith('/posts/') && req.method == "DELETE"){
        try{
            const id = req.url.split('/').pop();
            const posts = await Posts.findByIdAndDelete(id)
            handleSuccess(res, posts)
        }catch(err){
            handleError(res,err)
        }
    }else if(req.url.startsWith('/posts/') && req.method == "PATCH"){

        req.on('end',async() => {
            try{
                const id = req.url.split('/').pop()
                const editContent = JSON.parse(body).content
                const posts = await Posts.findByIdAndUpdate(id,{
                    content:editContent
                })
                if (editContent !== undefined && posts !== null){
                    handleSuccess(res,posts)
				} else {
                    handleError(res,err)
				}
            }catch(err){
                handleError(res,err)
            }
        })
    }else if(req.method == 'OPTIONS'){
        res.writeHead(200,headers)
        res.end()
    }else {
        res.writeHead(404, headers)
        res.write(JSON.stringify({
            "status":"false",
            "message":"無此網站路由"
        }))
        res.end()
    }
}

const server = http.createServer(requestListener);
server.listen(process.env.Port);