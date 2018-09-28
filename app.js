require('dotenv').config()
const express =  require("express"),
      mysql = require("mysql");
      bodyParser = require("body-parser");

var app = express();
const NODE_PORT = process.env.PORT;

const sqlFindAllBooks = "SELECT * FROM books LIMIT ? OFFSET ?";
const sqlFindOneBook = "SELECT id, concat(author_firstname, ' ', author_lastname), title, cover_thumbnail, modified_date, created_date FROM books WHERE id=? ";


var pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: process.env.DB_CONLIMIT
})

var makeQuery = (sql, pool)=>{
    console.log(sql);
    
    return  (args)=>{
        let queryPromise = new Promise((resolve, reject)=>{
            pool.getConnection((err, connection)=>{
                if(err){
                    reject(err);
                    return;
                }
                console.log(args);
                
                connection.query(sql, args || [], (err, results)=>{
                    connection.release();
                    if(err){
                        reject(err);
                        return;
                    }
                    console.log(">>> "+ results);
                    resolve(results); 
                })
            });
        });
        return queryPromise;
    }
}

var findOneBookById = makeQuery(sqlFindOneBook, pool);
var findAllBooks = makeQuery(sqlFindAllBooks, pool);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/books/:bookId", (req, res)=>{
    console.log("/books params !");
    let bookId = req.params.bookId;
    console.log(bookId);
    findOneBookById([parseInt(bookId)]).then((results)=>{
        console.log(results);
        res.json(results);
    }).catch((error)=>{
        res.status(500).json(error);
    })
    
})

app.get("/books", (req, res)=>{
    console.log("GET /books query !");
    var bookId = req.query.bookId;
    console.log(bookId);
    if(typeof(bookId) === 'undefined' ){
        console.log(">>>" + bookId);
        findAllBooks([10,0]).then((results)=>{
            console.log(results);
            res.json(results);
        }).catch((error)=>{
            res.status(500).json(error);
        });
    }else{
        findOneBookById([parseInt(bookId)]).then((results)=>{
            console.log(results);
            res.json(results);
        }).catch((error)=>{
            res.status(500).json(error);
        });
    }
    
})





app.listen(NODE_PORT, ()=>{
    console.log(`Listening to server at ${NODE_PORT}`)
})
