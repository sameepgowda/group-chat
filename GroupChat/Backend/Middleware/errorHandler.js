const errorHandler =  (err,req,res,next) =>{
    console.log(err);
    res.status(500).json({Error:err.message});
}

export {errorHandler};

