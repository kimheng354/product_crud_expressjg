const { create,update,remove,getList,} = require('../controller/teacher.controller.js')
const teacher=(app)=>{
//     app.get('/api/teacher/create', (req, res) => {
//         res.send("Teacher Create route");
//     });
//    app.get('/api/teacher/getList', (req, res) => {
//     res.send("Teacher Get list");
//    });
app.get('/api/teacher/getList',getList)
}
module.exports = {
    teacher
};