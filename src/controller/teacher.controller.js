const getList = (req, res) => {
    const value = [
        {
            name: 'kimheng',
            age: 23
        },
        {
            name: 'Ethan',
            age: 25
        },
        {
            name: 'Din',
            age: 25
        },
        {
            name: 'Din',
            age: 25
        }
    ];
    res.json(value);
};

const create=(req,res)=>{
    res.send("You have access controller teacher create");
}
const update=(req,res)=>{
    res.send("You have access controller teacher update");
}
const remove=(req,res)=>{
    res.send("You have access controller teacher remove");
}

module.exports = {
    create,
    update,
    remove,
    getList,
}