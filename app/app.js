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

app.post('/api/singin', jsonParser, function(req, res)
    {
        Users.findOne({
            where: {
                email: req.body.email, 
                password: hashing(req.body.password)
            }
        })
        .then(dbUser => {
                var token = jwt.sign({id: dbUser.id}, key);    
                //console.log(jwt.decode(token).id);
            
                res.send(token);
             
            })
        .catch(err => {res.send("Wrong email or password.\n")});
    });

app.post('/api/singup', jsonParser, function(req, res)
    {
        //res.send(hashing(req.body.password));
       Users.create({
            email: req.body.email,
            password: hashing(req.body.password)
            }
        )        
        .then(() => {res.send("User has been created successfully!\n");})
        .catch(err => {res.status(500).json(err);
        });
    });

////////////////////////////////////////////////////////

app.post('/api/todo/add', jsonParser, function(req, res)
    {
        req.body.todo.forEach(element =>
            {
                ToDos.create({
                user_id: jwt.decode(req.body.token).id,
                todo: element
                })
                .then(() => {res.send("Success!");})
                .catch(err => {res.send("Something goes wrong: \n" + err + "\n")});
        })    
    });

app.post('/api/todo/list', jsonParser, function(req, res)
    {
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
        req.body.id.forEach(element => {
            ToDos.findOne({where: {id: req.body.id}})
            .then(dbUser => {
                dbUser.update({is_done: "t"});
            })
        })
        res.send("Success\n");
    });

app.post('/api/todo/archive', jsonParser, function(req, res)
{
    req.body.id.forEach(element => {
        ToDos.findOne({where: {id: req.body.id}})
        .then(dbUser => {
            dbUser.update({in_archive: "t"});
        })
    })
    res.send("Success");

});

    
app.listen(3000, function()
    {
        //console.log("Example app listening on port 3000!");
    });


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