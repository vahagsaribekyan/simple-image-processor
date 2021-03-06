require('dotenv').load();

const path = require('path');
const fs = require('fs');
const storage = require('azure-storage');
const blobService = storage.createBlobService();
const Axios = require('axios')

const downloadImage = async (url, localPath) => {  
  const writer = fs.createWriteStream(localPath);

  const response = await Axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

const uploadLocalFile = (containerName, filePath) => {
    return new Promise((resolve, reject) => {
        const fullPath = path.resolve(filePath);
        const blobName = path.basename(filePath);
        blobService.createBlockBlobFromLocalFile(containerName, blobName, fullPath, err => {
            if (err) {
                reject(err);
            } else {
                resolve({ message: `Local file "${filePath}" is uploaded` });
            }
        });
    });
};

const deleteLocalFile = (fileName) => {
    return new Promise((resolve, reject) => {
        fs.unlink(fileName, function (err) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    })
}

module.exports = async function (context, req) {
    try {
        context.log('JavaScript HTTP trigger function started to process a request.');

        if (req.query.imageurl) {
            let url = req.query.imageurl;
            const fileFormat = url.substring(url.indexOf('format=') + 7);
            const imagePath = `./${req.query.name}.${fileFormat}`;
            await downloadImage(req.query.imageurl, imagePath);
            await uploadLocalFile('sample', imagePath);
            await deleteLocalFile(imagePath);
            context.res = {
                body: `${imagePath} added to blob`
            };
        }
        else {
            context.res = {
                status: 400,
                body: "Please pass the image url parameter in query"
            };
        }        
    }
    catch(err) {
        context.res = {
            status: 500,
            body: `Internal error: ${err.message}`
        };
    }
};
