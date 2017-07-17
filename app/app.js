const Sequelize = require("sequelize");
const express = require("express");
const bodyParser = require('body-parser');
const jwt = require("jsonwebtoken");
const exprjwt = require("express-jwt");
const app = express();
const crypto = require("crypto");
const jsonParser = bodyParser.json()
const key = "key";
const hashAddition = "glavriba";    

function hashing(data)
{
    const hash = crypto.createHash('sha256');
    hash.write(data + hashAddition);
    var hashStr = "";

    hash.on('readable', () => {
        h_data = hash.read();
        if(h_data)
            hashStr = h_data.toString('hex');
    })
    hash.end();

    return hashStr;
}

function verifyToken(token)
{
    try {
        jwt.verify(token, key)
    } catch(err)
    {
        return false;
    }
    return true;
}

const sequelize = new Sequelize('user_auth_test', "postgres", "1",
    {
        dialect: 'postgres'
    });

sequelize.authenticate()
    .then(() => 
    {
        //console.log("Connection has been established successfully");
    })
    .catch(err => 
    {
        console.error('Unable to connect to the DB');
    });

const Users = sequelize.define('users',
    {
        email: {
            type: Sequelize.STRING, 
            unique: true, 
            validate: {
                isEmail: true,
                notEmpty: true
            }
        }, 
        password: {
                type: Sequelize.STRING(64),
                validate: {
                    notEmpty: true
                }
            },
        is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    },
    {
        timestamps: false
    });

const ToDos = sequelize.define('todolists',
    {
        user_id: {
            type: Sequelize.INTEGER,
            validate: {
                notEmpty: true
            },
            references: {
                model: Users,
                key: 'id'
            }            
        },
        todo: {
            type: Sequelize.STRING(250),
            validate: {
                notEmpty: true
            }
        },
        is_done:{
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        in_archive:{
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }

    },
    {
        timestamps: false
    });

Users.sync();
ToDos.sync();

app.use(bodyParser.urlencoded({ extended: false }));

//app.use("/apic", jwt({/**/}));

////////////////////Authorithation//////////////////////////////////
app.post('/api/signin', jsonParser, function(req, res)
    {
        Users.findOne({
            where: {
                email: req.body.email, 
                password: hashing(req.body.password)
            }
        })
        .then(dbUser => {
                var token = jwt.sign({id: dbUser.id}, key);                
                res.send(token);             
            })
        .catch(err => {res.send("Wrong email or password.\n")});
    });

app.post('/api/signup', jsonParser, function(req, res)
    {
        let hash = jwt.sign({email: req.body.email}, key);

        Users.create({
            email: req.body.email,
            password: hashing(req.body.password)
            })        
        .then(() => {
            //sendEmail(req.body.email, hash);
            res.send(hash);
        })
        .catch(err => {res.status(500).json(err);
        });
    });

app.post('/api/signup/:hash', jsonParser, function(req, res)
    {
        if(!verifyToken(req.params.hash))
        {
            res.send("Wrong token");
            return;
        }

        Users.findOne({
            where: {
                email: jwt.decode(req.params.hash).email
            }
        })
        .then(dbUser => {
            dbUser.update({is_active: true});
            res.send("User has been created successfully!\n");
        }, () => {res.send("wrong token");})
    })
/////////////////ToDo list///////////////////////////////////////

app.post('/api/todo/add', jsonParser, function(req, res)
    {
        if(!verifyToken(req.body.token))
        {
            res.send("Wrong token");
            return;
        }

        let arr = [];
        
        req.body.todo.forEach(element =>
            {
                arr[arr.length] = {user_id: jwt.decode(req.body.token).id, todo: element};
        });

        ToDos.bulkCreate(arr)
        .then(()=>{
            res.send("Success!");
        })
    });

app.post('/api/todo/list', jsonParser, function(req, res)
    {
        if(!verifyToken(req.body.token))
        {
            res.send("Wrong token");
            return;
        }

        ToDos.findAll({
            where: {user_id: jwt.decode(req.body.token).id, 
                    in_archive: false}
        })
        .then(dbUsers => {
            const todos = dbUsers.map(element => {return [element.id, element.todo]});
            res.json(todos);
        })
        .catch(err => {res.send(err);});
    }); 

app.post('/api/todo/list/archive', jsonParser, function(req, res)
    {
        if(!verifyToken(req.body.token))
        {
            res.send("Wrong token");
            return;
        }
        
        ToDos.findAll({
            where: {user_id: jwt.decode(req.body.token).id, 
                    in_archive: true}
        })
        .then(dbUsers => {
            const todos = dbUsers.map(element => { return [element.id, element.todo]});
            res.json(todos);
        })
        .catch(err => {res.send(err);});
    }); 

app.post('/api/todo/done', jsonParser, function(req, res)
    {
        ToDos.sequelize.query("UPDATE todolists SET is_done = 't' " +
        "WHERE id IN(:array)", {replacements: {array: req.body.id}})
        .spread(()=>{return 'success';});
        res.send("Success!");
    });

app.post('/api/todo/archive', jsonParser, function(req, res)
    {
        ToDos.sequelize.query("UPDATE todolists SET in_archive = 't' " +
        "WHERE id IN(:array)", {replacements: {array: req.body.id}})
        .spread(()=>{return 'success';});
        res.send("Success!");
    });

    
app.listen(3000, function()
    {
        //console.log("Example app listening on port 3000!");
    });