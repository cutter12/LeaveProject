const   express = require('express'),
        app = express(),
        ADODB = require('node-adodb'),
        nodemailer = require('nodemailer'),
        flash = require('req-flash'),
        moment = require('moment'),
        nodeoutlook = require('nodejs-nodemailer-outlook'),
        multer = require('multer'),  // INSTALL MULTURE LIBRARY FOR UPLOAD IMAGE
        PORT = process.env.PORT || 3000,
        path = require('path'),
        Email = require('email-templates'),
        fs = require('fs'),
        ejs = require('ejs');
        
var     dirname = 'Provider=Microsoft.ACE.OLEDB.12.0;Data Source='+__dirname+'\\models\\PIS.accdb;Persist Security Info=False;';


// 1. Image Upload
const   storage = multer.diskStorage({
    destination:'public/upload_image/',
    filename:(req,file,cb) => {
        cb(null,file.fieldname+'-'+req.session.emp_id+Date.now()+path.extname(file.originalname))
    }
});

// 2. Image Upload 
var upload = multer({
    storage:storage,
    limits:{fileSize:2000000},
    fileFilter:function(req,file,cb){
        checkFileType(file,cb)
    }
}).single('myImage');
// 3. Image Upload
function checkFileType(file,cb){
    const filetypes = /jpg|jpeg|png|gif|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype)

    if(mimetype && extname){
        return cb(null,true);
    }else{
        cb('Error : Image Only');
    }
}
// Image Upload



const connection = ADODB.open(dirname);

var methodOverride = require('method-override'),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    cookieParser = require('cookie-parser'),
    session = require('express-session');

app.set('view engine','ejs'); // use ejs engine
app.use(bodyParser.urlencoded({extended:true})); //use bodyparser ex. req.body.username
app.use(cookieParser());
app.use(methodOverride('_method')); //method override for route.put(update) and route.delete
app.use(express.static('public'));
app.use(session({ secret: '123' }));
app.use(flash());

//set express session
app.use(session({
    secret:'Hello',
    resave:false,
    saveUninitialized:false
}));

var sess;
//method for check whether user login or not if login alread can't access login page
//but if not login (session don't have value) user can't access body page but can access login page
function isLoggedIn(req,res,next){
    sess = req.session;
    if(sess.emp_id){
        next();
        
    }else{
        res.redirect('/');
    }
}

//method for whether user login or not if login alread can't access login page
//but if not login (session don't have value) user can't access body page
app.get('/',(req,res)=>{

    sess = req.session;
    
    


    if(sess.emp_id){
        switch(sess.emp_id){
            case '1034':
            case '1038':
            case '1047':
            case '1003':
            case '1006':
            case '1061':
            case '1062':
            case '1087':
            case '1088':
                res.redirect('/managerBody');
            break;
            default:
                res.redirect('/memberBody');
        }
    }else{
        res.render('login',{log_check:req.flash()});
    }    
});

//check input form is equal data in database 
// login by check user emp id and id card correct
app.post('/login',(req,res)=>{
    connection.query(`
                        SELECT Employee.Emp_ID FROM Employee WHERE [Employee].[Emp_ID] = '`+req.body.emp_id+`' AND [Employee].[Birth_Date] = #`+req.body.birth_date+`#
                    `)
                    .then(data=>{
                        if(data.length === 1){
                            sess = req.session;
                            sess.emp_id = req.body.emp_id;
                            var position = req.body.isPosition;

                            
                            switch(sess.emp_id){
                                case '1034':
                                case '1038':
                                case '1047':
                                case '1003':
                                case '1006':
                                case '1061':
                                case '1062':
                                case '1087':
                                case '1088':
                                    if(position === 'manager'){
                                        res.redirect('/managerBody');
                                    }else{
                                        res.redirect('/memberBody');
                                    }
                                break;
                                default:
                                    res.redirect('/memberBody');
                            }


                            // if((sess.emp_id === '1034') || (sess.emp_id === '1038') || (sess.emp_id === '1047') || (sess.emp_id === '1003') || (sess.emp_id === '1006')|| (sess.emp_id === '1061') || (sess.emp_id === '1062') || (sess.emp_id === '1087') || (sess.emp_id === '1088')){
                            //     res.redirect('/managerBody');
                            // }else{
                            //     res.redirect('/memberBody');
                            // }
                            
                        }else{
                            req.flash('error','รหัสพนักงานหรือวันเกิดไม่ถูกต้อง ! กรุณาลองใหม่อีกครั้ง')
                            res.redirect('/');
                        }
                    })
});




app.get('/template',(req,res) => {
    res.render('mail_template');
});


function emailConnect(){
    const transporter = nodemailer.createTransport({
        host:'smtpm.csloxinfo.com',
        port:587,
        secure:false,
        auth: {
        user: 'teichit@tfu.co.th ', 
        pass: 'Tihciet111' 
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}



function approveMail(id){


    connection.query(`SELECT TOP 1 [leave_log].[emp_id], [Employee].[Name_Th], [leave_log].[leave_log_date_start], 
    [leave_log].[leave_log_date_end], [leave_log].[leave_log_type], [leave_log].[leave_log_section], [leave_log].[leave_log_detail],
    (SELECT TOP 1 DATEDIFF("d",[leave_log].[leave_log_date_start],[leave_log].[leave_log_date_end])
    FROM [leave_log] WHERE [leave_log].[emp_id] = '`+id+`'
    ORDER BY [leave_log].[leave_log_id] DESC) AS CountDate
    FROM [leave_log] INNER JOIN [Employee] ON [leave_log].[emp_id] = [Employee].[Emp_ID]
    WHERE (([Employee].[Emp_ID]='`+id+`')) 
    ORDER BY [leave_log].[leave_log_id] DESC 
    `)
    .then(mail_data=>{

        connection.query(`SELECT [Employee].[Name_Th], [IT_Information].[Email_Internet], [Section].[Section_Desc], [Employee].[Section_Head]
        FROM ([Employee] INNER JOIN [IT_Information] ON [Employee].[Emp_ID] = [IT_Information].[Emp_ID]) INNER JOIN [Section] ON [Employee].[Section_Code] = [Section].[Section_Code]
        WHERE ((([Section].[Section_Desc])='${mail_data[0].leave_log_section}') AND (([Employee].[Section_Head])='01'));`)
        .then(section_head => {

            var a = moment(mail_data[0].leave_log_date_start);
            var b = moment(mail_data[0].leave_log_date_end);
            
            var day_count = b.diff(a,'days')+1;
                
            const transporter = nodemailer.createTransport({
                host:'smtpm.csloxinfo.com',
                port:587,
                secure:false,
                auth: {
                user: 'teichit@tfu.co.th ', 
                pass: 'Tihciet111' 
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

                ejs.renderFile(__dirname + '\\emails\\mars\\mail_template.ejs', {emp_data:mail_data,mg_data:section_head,moments:moment,day:day_count},function(err,data){
                    if(err){
                        console.log(err);
                    }else{
                        let message = {
                            from:"tfu_leave@tfu.co.th",              
                            to: `teichit@tfu.co.th`,                
                            subject: `ขออนุญาติลา แผนก ${mail_data[0].leave_log_section}`,              
                            html:data
                        };   
                        transporter.sendMail(message, function (err, info) {
                            if(err){
                                console.log(err);
                            
                            }else{
                                console.log(info);
                            
                            }
                        });
                    }
                })

                // let message = {
                //     from:"tfu_leave@tfu.co.th",              
                //     to: `${section_head[0].Email_Internet}`,                
                //     subject: `ขออนุญาติลา แผนก ${mail_data[0].leave_log_section}`,              
                //     html: `<strong>เรียน คุณ : ${section_head[0].Name_Th}</strong> 
                //         ข้าพเจ้า ${mail_data[0].Name_Th} รหัสพนักงาน ${mail_data[0].emp_id} แผนก ${mail_data[0].leave_log_section} มีความประสงค์ ${mail_data[0].leave_log_type}
                //         เนื่องจาก ${mail_data[0].leave_log_detail} จากวันที่ ${moment(mail_data[0].leave_log_date_start).format("DD/MM/YYYY")} ถึงวันที่ ${moment(mail_data[0].leave_log_date_end).format("DD/MM/YYYY")} เป็นจำนวนวัน ${day_count} วัน
                //         จึงขอเรียนมาเพื่อพิจารณา` 
                // };   
                // transporter.sendMail(message, function (err, info) {
                //     if(err){
                //         console.log(err);
                    
                //     }else{
                //         console.log(info);
                    
                //     }
                // });
        })
        .catch(sec_error => {
            console.log(error);
        })



       
    })      
}





//body page for show all data (Main page)
app.get('/managerBody',isLoggedIn,(req,res)=>{ 

    connection.query(`SELECT [Employee].[Emp_ID],[Employee].[Name_Th],[Section].[Section_Desc]
                        FROM [Employee] INNER JOIN [Section] ON [Employee].[Section_Code] = [Section].[Section_Code] 
                        WHERE [Employee].[Emp_ID] = '${req.session.emp_id}'`)
    .then(manager => {
        connection.query(`SELECT [Employee].[Emp_ID],[Employee].[Name_Th],[Section].[Section_Desc],
        [leave_log].[leave_log_id],[leave_log].[leave_log_datestamp],[leave_log].[leave_log_type],[leave_log].[leave_log_section],
        [leave_log].[leave_log_detail],[leave_log].[leave_log_date_start],[leave_log].[leave_log_date_end],[leave_log].[leave_log_status],[leave_log].[leave_log_img]
        FROM ([Employee] INNER JOIN [leave_log] ON [Employee].[Emp_ID] = [leave_log].[emp_id]) INNER JOIN [Section] ON [Employee].[Section_Code] = [Section].[Section_Code]
        WHERE (([Section].[Section_Desc]='${manager[0].Section_Desc}') AND ([leave_log].[leave_log_status]='pending')) ORDER BY [leave_log].[leave_log_datestamp] ASC`)
        .then(member => {
            switch(req.session.emp_id){
                case '1034':
                case '1038':
                case '1047':
                case '1003':
                case '1006':
                case '1061':
                case '1062':
                case '1087':
                case '1088':
                    res.render('manageBody',{managers:manager,members:member,moments:moment});
                break;
                default:
                    res.redirect('/memberBody');
            }
            
        })
        .catch(error1 => {
            console.log(error1);
        })
    })
    .catch(error => {
        console.log(error);
    })
   
});

app.get('/memberBody',isLoggedIn,(req,res) => {
    connection.query(`SELECT [Employee].[Emp_ID],[Employee].[Name_Th],[Employee].[BeginWork_Date],[Section].[Section_Desc],
                        [leave_log].[leave_log_id],[leave_log].[leave_log_datestamp],[leave_log].[leave_log_type],[leave_log].[leave_log_section],
                        [leave_log].[leave_log_detail],[leave_log].[leave_log_date_start],[leave_log].[leave_log_date_end],[leave_log].[leave_log_status],[leave_log].[leave_log_img]
                        FROM ([Employee] INNER JOIN [leave_log] ON [Employee].[Emp_ID] = [leave_log].[emp_id]) INNER JOIN [Section] ON [Employee].[Section_Code] = [Section].[Section_Code]
                        WHERE (([Employee].[Emp_ID]='${req.session.emp_id}')) ORDER BY [leave_log].[leave_log_datestamp] ASC `)
    .then(response => {
        if(response.length === 0){
            res.redirect('/add/request');
        }else{
            res.render('memberBody',{value:response,moments:moment});
            
        }
    })
    .catch(err => {
        console.log(err);
    })
    
})



app.get('/add/request',isLoggedIn,(req,res) => {
    connection.query(`SELECT [Employee].[Emp_ID],[Employee].[Name_Th],[Section].[Section_Desc]
                        FROM [Employee] INNER JOIN [Section] ON [Employee].[Section_Code] = [Section].[Section_Code]
                        WHERE [Employee].[Emp_ID] = '${req.session.emp_id}'`)
    .then(data => {
        res.render('add',{value:data});
    })
    .catch(error => {
        console.log(error);
    })
});


//route for logout //linkis /logout delete session and redirect to login page
app.get('/logout',(req,res)=>{
    req.session.destroy((error=>{
        console.log(error);
    }));
    res.redirect('/');
})


var img = 'no_picture';
app.post('/add',(req,res) => {
    var leave_status = 'pending';
    
    connection.execute(`INSERT INTO [leave_log] ([leave_log_type],[leave_log_section],[leave_log_detail],[leave_log_date_start],[leave_log_date_end],[leave_log_status],[leave_log_img],[emp_id])
            VALUES ('${req.body.leave_type}','${req.body.section}','${req.body.detail}',#${req.body.leave_start_date}#,#${req.body.leave_end_date}#,'${leave_status}','${img}','${req.session.emp_id}')`)
            .then(data1=>{

                
                // approveMail(req.session.emp_id);
        
                switch(req.session.emp_id){
                    case '1034':
                    case '1038':
                    case '1047':
                    case '1003':
                    case '1006':
                    case '1061':
                    case '1062':
                    case '1087':
                    case '1088':
                        res.redirect('/managerBody');
                    break;
                    default:
                        res.redirect('/memberBody');
                }
          
            })
            .catch(error=>{
                if(error){
                    console.log(error);

                }
            })
});


app.get('/upload',(req,res) => {
    res.render('upload',{msg:req.flash()});
})

app.post('/upload',(req,res) => {
    upload(req,res,(err) => {
        if(err){
            req.flash('failed','อัพโหลดไฟล์ภาพขนาดไม่เกิน 2MB เท่านั้น');
            res.redirect('/upload');
        }else{
            img = req.file.filename;
            req.flash('success','ภาพของท่านถูกอัพโหลดเรียบร้อย สามารถปิดหน้านี้ได้เลย')
            res.redirect('/upload');
        }
    });
})




//ROUTE FOR DELETE BY ID
app.delete('/delete/:id',(req,res)=>{
    var id = req.params.id;
    connection.execute(`DELETE FROM [leave_log] WHERE [leave_log].[leave_log_id] = ${id}`)
    .then(data=>{
        if((req.session.emp_id == '1034') || (req.session.emp_id == '1038') || (req.session.emp_id == '1047') || (req.session.emp_id == '1003') || (req.session.emp_id == '1006') || (req.session.emp_id == '1061') || (req.session.emp_id == '1062') || (req.session.emp_id == '1087') || (req.session.emp_id == '1088')){
            res.redirect('/managerBody');
        }else{
            res.redirect('/memberBody');
        } 
    })
    .catch(error=>{
        console.log(error);
    })
});


//ROUTE FOR UPDATE
app.put('/update/:emp_id/:id',(req,res)=>{
    var id = req.params.id;
    var manager_check = req.body.manager_check;
    var emp_id = req.params.emp_id;
    var day_count = req.body.day_count;
    connection.execute('UPDATE [leave_log] SET [leave_log].[leave_log_status] ="'+manager_check+'",[leave_log].[leave_log_sum_date] = '+day_count+' WHERE [leave_log].[leave_log_id] = '+id)
    .then(data=>{

        connection.query(`SELECT [leave_log].[emp_id],[leave_log].[leave_log_type],[leave_log].[leave_log_date_start],[leave_log].[leave_log_date_end],[leave_log].[leave_log_sum_date],
                        [leave_log].[leave_log_detail],[leave_log].[leave_log_datestamp] 
                        FROM [leave_log] WHERE [leave_log].[leave_log_id] = ${id}`).
                        then(response => {
                            
                            connection.execute(`INSERT INTO [Attendance] ([Emp_ID],[Absent_Type],[Date_from],[Date_To],[Sum_Date],
                                [Comment],[Create_Date]) 
                                VALUES ('${response[0].emp_id}','${response[0].leave_log_type}',#${moment(response[0].leave_log_date_start).format("DD/MM/YYYY")}#,#${moment(response[0].leave_log_date_end).format("DD/MM/YYYY")}#,'${response[0].leave_log_sum_date}','${response[0].leave_log_detail}',#${moment(response[0].leave_log_datestamp).format("DD/MM/YYYY")}#)`)
                                .then(after_insert => {
                                    console.log(after_insert);
                                })
                                .catch(insert_error => {
                                    console.log(insert_error);
                                })
                        })
                        .catch(err => {
                            console.log(err);
                        })



        // toUserMail(emp_id,id);


        res.redirect('/managerBody');



    })
    .catch(error=>{
        console.log(error);
    });
})



function toUserMail(emp_id,id){
    connection.query(`SELECT [IT_Information].[Email_Internet],[Employee].[Emp_ID]
                        FROM [IT_Information] INNER JOIN [Employee] ON [IT_Information].[Emp_ID] = [Employee].[Emp_ID]
                        WHERE [Employee].[Emp_ID] = '${emp_id}'`)
    .then(mail => {
        
        const transporter = nodemailer.createTransport({
            host:'smtpm.csloxinfo.com',
            port:587,
            secure:false,
            auth: {
            user: 'teichit@tfu.co.th ', 
            pass: 'Tihciet111' 
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    
        let message = {
            from:"tfu_leave@tfu.co.th",              
            to: `${mail[0].Email_Internet}`,                
            subject: `คำลาได้รับการอนุมัติแล้ว`,              
            html: `ขอลาของท่านได้รับการอนุมัติจากหัวหน้าแผนกแล้ว` 
        };   
        transporter.sendMail(message, function (err, info) {
            if(err){
                console.log('send failed');
                console.log(err);
                
               
            }else{
                console.log(info);
                console.log('send pass'+id);
            }
        });
    })
    .catch(err => {
        console.log(err);
    })
}


app.get(`/member_section`,(req,res) => {
    connection.query(`SELECT [Employee].[Emp_ID],[Section].[Section_Code]
                    FROM [Employee] INNER JOIN [Section] ON [Employee].[Section_Code] = [Section].[Section_Code]
                    WHERE [Employee].[Emp_ID] = '${req.session.emp_id}'`)
    .then(data=>{
        connection.query(`SELECT [Employee].[Emp_ID],[Employee].[Name_Th] FROM [Employee]
        WHERE [Employee].[Section_Code] = '${data[0].Section_Code}'
        ORDER BY [Employee].[Emp_ID] ASC`)
        .then(full_data => {
            res.send(full_data);
        })
        .catch(err=>{
            console.log(err);
        })
    })
    .catch(error=>{
        console.log(error);
    });
})

app.get('/member/:id/:year',(req,res)=>{

    connection.query(`SELECT [Employee].[Emp_ID], [Employee].[Name_Th], [Section].[Section_Desc], [Attendance].[Create_Date], [Attendance].[Date_from], [Attendance].[Date_To], [Attendance].[Comment], [Absent_Type].[Absent_Desc],[Attendance].[Sum_Date]
    FROM (([Employee] INNER JOIN [Section] ON [Employee].[Section_Code] = [Section].[Section_Code]) INNER JOIN [Attendance] ON [Employee].[Emp_ID] = [Attendance].[Emp_ID]) INNER JOIN [Absent_Type] ON [Attendance].[Absent_type] = [Absent_Type].[Absent_Code]
    WHERE ((([Employee].[Emp_ID])='${req.params.id}') AND (([Attendance].[Create_Date]) > #1/1/${req.params.year}# And ([Attendance].[Create_Date]) < #31/12/${req.params.year}#)) ORDER BY [Attendance].[Create_date] DESC;`)
    .then(mem => {
        res.send(mem);
    })
    .catch(err => {
        console.log(err);
    });
});





// app.get('/member_detail',(req,res)=>{
//     connection.query(``)
//     .then()
//     .catch()
// });








//ROUTE FOR SHOW EDIT PAGE
// app.get('/edit/:id',(req,res)=>{
//     var id = req.params.id;
//     connection.query("SELECT * FROM `User` WHERE id = "+id)
//     .then(data=>{
//         res.render('edit',{value:data});
//     })
//     .catch(error=>{
//         console.log(error);
//     })
// });



app.listen(PORT,()=>{console.log("Server has started")});