import { _decorator, Prefab, Node, Sprite, SpriteFrame, Texture2D, Asset, error, instantiate, find, 
    resources, isValid, assetManager, LoadCompleteCallback, JsonAsset} from "cc";

const { ccclass } = _decorator;
@ccclass("ConfigUtil")
export class ConfigUtil {
    public static getDataByKey(data: JsonAsset, key, value)
    {
        if (!data || !key)
        {
            return;
        }

        const jsonData: object = data.json!;
        let keys = Object.keys(jsonData);
        const resultArray: object[] = []; // 用于存储匹配的元素的数组
        for (let i = 0; i < keys.length; i++)
        {
            const element = jsonData[i][key];
            if (jsonData[i][key] == value)
            {
                resultArray.push(jsonData[i]);
            }
        }
        return resultArray;
    }

    public static getDataBySn(data: JsonAsset, sn)
    {
        if (!data)
        {
            return;
        }

        const jsonData: object = data.json!;
        let keys = Object.keys(jsonData);
        for (let i = 0; i < keys.length; i++)
        {
            const element = jsonData[i];
            if (jsonData[i]["sn"] == sn)
            {
                return element;
            }
        }
        return null;
    }
}
