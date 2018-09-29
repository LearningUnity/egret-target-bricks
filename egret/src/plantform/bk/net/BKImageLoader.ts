namespace egret {
    export class BKImageLoader extends EventDispatcher implements ImageLoader {
        public static crossOrigin: string = null;

        /**
         * @private
         * 使用 load() 方法加载成功的 BitmapData 图像数据。
         */
        public data: BitmapData = null;

        private _crossOrigin: string = null;
        private _hasCrossOriginSet: boolean = false;
        public set crossOrigin(value: string) {
            this._hasCrossOriginSet = true;
            this._crossOrigin = value;
        }
        public get crossOrigin(): string {
            return this._crossOrigin;
        }

        public load(url: string): void {
            if (url.indexOf('http://') >= 0 || url.indexOf('https://') >= 0) {
                //网络加载
                //根据url存储缓存的图片到沙盒中
                let sha1 = _sha1FromUrl(url);
                let imgUrl = "GameSandBox://webcache/image" + sha1
                let isFileExist = BK.FileUtil.isFileExist(imgUrl);
                if (isFileExist) {
                    this._loadFromBuffer.call(this, imgUrl);
                } else {
                    var httpGet = new BK.HttpUtil(url);
                    httpGet.setHttpMethod("get")
                    httpGet.requestAsync(function (res, code) {
                        if (code == 200) {
                            (BK.FileUtil as any).writeBufferToFile(imgUrl, res);
                            this._loadFromBuffer.call(this, imgUrl);
                        } else {
                            console.log("BK http加载外部资源失败, url = " + url + ", code = " + code);
                            $callAsync(Event.dispatchEvent, IOErrorEvent, this, IOErrorEvent.IO_ERROR);
                        }
                    }.bind(this));
                }

            } else {
                let base64Index = url.indexOf(';base64,');
                if (base64Index < 0) {
                    //本地加载
                    //图片加载还要包括头像
                    let path = url.indexOf("GameRes://") >= 0 || url.indexOf("GameSandBox://") >= 0 ? url : "GameRes://" + url;
                    if (BK.FileUtil.isFileExist(path)) {
                        this.data = new egret.BitmapData(path);
                        $callAsync(Event.dispatchEvent, Event, this, Event.COMPLETE);
                    }
                    else {
                        $callAsync(Event.dispatchEvent, IOErrorEvent, this, IOErrorEvent.IO_ERROR);
                    }
                } else {
                    //base64加载
                    let data = new egret.BitmapData(url);
                    if (data.source != undefined) {
                        this.data = data;
                        $callAsync(Event.dispatchEvent, Event, this, Event.COMPLETE);
                    } else {
                        $callAsync(Event.dispatchEvent, IOErrorEvent, this, IOErrorEvent.IO_ERROR);
                    }
                }
            }
        }

        /**
         * 通过buffer读取texture
         */
        private _loadFromBuffer(imgUrl: string) {
            let bitmapData = new egret.BitmapData(imgUrl);
            this.data = bitmapData;
            $callAsync(Event.dispatchEvent, Event, this, Event.COMPLETE);
        }
    }


    ImageLoader = BKImageLoader;
}