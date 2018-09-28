require('dotenv').config()
const express =  require("express"),
      path = require('path'),
      mysql = require("mysql"),
      bodyParser = require("body-parser"),
      paginate = require('express-paginate');
var sortBy = require('sort-by');

var app = express();
const NODE_PORT = process.env.PORT;

//const sqlFindAllBooks = "SELECT cover_thumbnail, title, concat(author_firstname, ' ', author_lastname) as author FROM books LIMIT ? OFFSET ?";
const sqlFindAllBooks = "SELECT cover_thumbnail, title, concat(author_firstname, ' ', author_lastname) as author FROM books WHERE (title LIKE ?) || (concat(author_firstname, ' ', author_lastname) LIKE ?) LIMIT ? OFFSET ?";
//const sqlFindOneBook = "SELECT id, concat(author_firstname, ' ', author_lastname) as author, title, cover_thumbnail, modified_date, created_date FROM books WHERE id=? ";
const sqlFindOneBook = "SELECT * FROM books WHERE id=? ";

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
//app.use('/images', express.static(path.join(__dirname + '/public' + '/thumbnails')));
//app.use(paginate.middleware(10, 50));

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
    let limit = parseInt(req.query.limit) || 10;
    let offset = parseInt(req.query.offset) || 0;
    console.log("GET /books query !");
    var bookId = req.query.bookId;
    console.log(bookId);



    if(typeof(bookId) === 'undefined' ){
        console.log(req.query);
        console.log(">>>" + bookId);
        var keyword = req.query.keyword;
        var selectionType = req.query.selectionType;
        console.log(keyword);
        console.log(selectionType);

        let finalCriteriaFromType = ['%', '%' , limit, offset];
        if(selectionType == 'BT'){
            finalCriteriaFromType = ['%' + keyword + '%', '' ,limit, offset]
        }

        if(selectionType == 'A'){
            finalCriteriaFromType = ['', '%' +keyword + '%',limit, offset]
        }

        if(selectionType == 'B'){
            finalCriteriaFromType = ['%' + keyword + '%', '%' +keyword + '%' ,limit, offset]
        }
        //findAllBooks([10,0])
        findAllBooks(finalCriteriaFromType).then((results)=>{
            console.log(results.sort(sortBy('title')));
            res.json(results.sort(sortBy('title')));
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
