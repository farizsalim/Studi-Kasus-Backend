const path = require('path');
const fs = require('fs');
const config = require('../config');
const Product = require('./model');
const Category = require('../category/model')
const Tag = require('../tag/model')
const { ObjectId } = require('bson');
const tagController = require('../tag/controller');

const store = async (req, res, next) => {
    try {
        let payload = req.body;

        if (payload.category) {
            let category = await Category.findOne({ name: { $regex: payload.category, $options: 'i' } });
            if (category) {
                payload = { ...payload, category: category._id };
            } else {
                delete payload.category;
            }
        }

        if (payload.tags && payload.tags.length > 0) {
            let tags;
            if (Array.isArray(payload.tags)) {
                tags = payload.tags;
            } else {
                tags = payload.tags.split(',').map(tag => tag.trim());
            }
        
            let existingTags = await Tag.find({ name: { $in: tags } });
            let existingTagNames = existingTags.map(tag => tag.name);
        
            let newTags = tags.filter(tag => !existingTagNames.includes(tag));
        
            if (existingTags.length) {
                payload = { ...payload, tags: existingTags.map(tag => tag._id) };
            }
        
            const newTagObjects = await Promise.all(newTags.map(async (newTag) => {
                const tagObject = await tagController.store({ body: { name: newTag } }, null, next);
                return tagObject._id;
            }));
        
            const successfullyStoredTags = newTagObjects.filter(tagId => tagId);
        
            const finalTags = [...(payload.tags || []), ...successfullyStoredTags].filter(tagId => tagId);
        
            payload = { ...payload, tags: finalTags };
        } else {
            delete payload.tags;
        }
        

        if (req.file) {
            let tmp_path = req.file.path;
            let originalExt = req.file.originalname.split('.')[req.file.originalname.split('.').length - 1];
            let filename = req.file.filename + '.' + originalExt;
            let target_path = path.resolve(config.rootPath, `public/images/products/${filename}`);

            const src = fs.createReadStream(tmp_path);
            const dest = fs.createWriteStream(target_path);

            src.pipe(dest);

            src.on('end', async () => {
                try {
                    let product = new Product({ ...payload, image_url: filename });
                    await product.save();
                    return res.json(product);
                } catch (err) {
                    fs.unlinkSync(target_path);
                    if (err && err.name === 'ValidationError') {
                        return res.json({
                            error: 1,
                            message: err.message,
                            fields: err.errors
                        });
                    }
                    next(err);
                }
            });

            src.on('error', (err) => {
                next(err);
            });
        } else {
            let product = new Product(payload);
            await product.save();
            return res.json(product);
        }
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }
};



const update = async (req, res, next) => {
    try {
        let payload = req.body;
        let { id } = req.params;

        let product = await Product.findById(id);

        if (payload.category) {
            let category = await Category.findOne({ name: { $regex: payload.category, $options: 'i' } });
            if (category) {
                payload = { ...payload, category: category._id };
            } else {
                delete payload.category;
            }
        }

        if (payload.tags && payload.tags.length > 0) {
            let tags;
            if (Array.isArray(payload.tags)) {
                tags = payload.tags;
            } else {
                tags = payload.tags.split(',').map(tag => tag.trim());
            }

            let existingTags = await Tag.find({ name: { $in: tags } });

            if (existingTags.length) {
                payload = { ...payload, tags: existingTags.map(tag => new ObjectId(tag._id)) };
            } else {
                delete payload.tags;
            }
        }

        if (req.file) {
            let tmp_path = req.file.path;
            let originalExt = req.file.originalname.split('.')[req.file.originalname.split('.').length - 1];
            let filename = req.file.filename + '.' + originalExt;
            let target_path = path.resolve(config.rootPath, `public/images/products/${filename}`);
            let currentImage = path.resolve(config.rootPath, `public/images/products/${product.image_url}`);

            if (fs.existsSync(currentImage)) {
                fs.unlinkSync(currentImage);
            }

            const src = fs.createReadStream(tmp_path);
            const dest = fs.createWriteStream(target_path);
            src.pipe(dest);

            src.on('end', async () => {
                try {
                    product = await Product.findByIdAndUpdate(id, { ...payload, image_url: filename }, {
                        new: true,
                        runValidators: true
                    });

                    return res.json(product);
                } catch (err) {
                    fs.unlinkSync(target_path);
                    if (err && err.name === 'ValidationError') {
                        return res.json({
                            error: 1,
                            message: err.message,
                            fields: err.errors
                        });
                    }
                    next(err);
                }
            });

            src.on('error', (err) => {
                next(err);
            });
        } else {
            let product = await Product.findByIdAndUpdate(id, payload, {
                new: true,
                runValidators: true
            });

            return res.json(product);
        }
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }
};


const index = async (req,res,next) => {
    try {
        let {skip = 0, limit = 10, q='', category= '' , tags = []} = req.query;

        let criteria = {};

        if(q.length){
             criteria = {
                ...criteria,
                name: { $regex: new RegExp(q, 'i') }
             }
        }

        if(category.length){
            category = await Category.findOne({name: { $regex: new RegExp(category, 'i')}});
        
            if(category){
                criteria = {...criteria, category: category._id}
            }
        }

        if(tags.length){
            tags =  await Tag.find({ name: { $in: tags.map(tag => new RegExp(tag, 'i')) } });
            criteria = {...criteria, tags: {$in: tags.map(tag => tag._id)}}
        }

        let count = await Product.find().countDocuments();

        let product = await Product
        .find(criteria)
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .populate('category')
        .populate('tags')
        return res.json({
           data: product,
           count
        })
    } catch (err) {
        next(err)
    }
}

const destroy = async (req, res, next) => {
    try {
      let product = await Product.findById(req.params.id);
      let currentImage = `${config.rootPath}/public/images/products/${product.image_url}`;
      if(fs.existsSync(currentImage)){
        fs.unlinkSync(currentImage)
        await Product.deleteOne({ _id: req.params.id });
    }
      return res.json(product);
    }catch(err) {
      next(err);
    }
}

module.exports = {
    store,index,update,destroy
};
