import ImageKit from "imagekit";
import config from "../config/index.js";
import multer from "multer";

const imageKit = new ImageKit({
  publicKey: config.imageKitPublicKey,
  privateKey: config.imageKitPrivateKey,
  urlEndpoint: config.imageKitUrlEndpoint,
});

class ImageKitService {
  static async uploadFile(
    file: Express.Multer.File,
    folder: string,
    fileName?: string
  ) {
    const result = await imageKit.upload({
      file: file.buffer,
      fileName: fileName || file.originalname,
      folder: folder,
    });
    return {
      fileId: result.fileId,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      name: result.name,
    };
  }
  static async deleteFile(fileId: string) {
    await imageKit.deleteFile(fileId);
    return true;
  }
  static getAuthenticationParameters() {
    return imageKit.getAuthenticationParameters();
  }
}

export default ImageKitService;
