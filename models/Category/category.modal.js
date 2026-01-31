import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim: true
    },
    images:[
        {
            type:String,
        }
    ],
    parentCatName:{
        type:String,
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
      },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true
    }
},{timestamps:true});


const CategoryModel = mongoose.model('Category',categorySchema)

export default CategoryModel