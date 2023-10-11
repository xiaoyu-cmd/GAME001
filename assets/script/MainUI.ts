import { _decorator, Vec3, Vec2, tween, ScrollView, JsonAsset, Component, 
    Node, Sprite, SpriteFrame, AnimationState, Prefab, instantiate, ParticleSystem, 
    math, UIMeshRenderer, resources, UITransform, macro} from 'cc';
import { EffectPlay } from "./EffectPlay";
import { resourceUtil } from "./resourceUtil";
import { MapUI } from "./MapUI";
import { EventSlot } from "./EventSlot";
import { ConfigUtil } from "./ConfigUtil";
import { UserData } from "./UserData";
import { uiManager } from "./uiManager";

// import * as CryptoJS from 'crypto-es';
// import * as CryptoES from 'crypto-es/lib/'
// import { Utf16BE } from 'crypto-es/lib/enc-utf16';
import CryptoES from 'crypto-es';
// import { AES } from 'crypto-ts';
// import * as CryptoJS from 'crypto-js';
// import * as SHA256 from 'crypto-js/sha256';

// const crypto = require('crypto');

// import { resourceUtil } from "../framework/resourceUtil";
const { ccclass, property } = _decorator;


const getRandomInt = function (min: number, max: number) {
    var ratio = Math.random();
    return min + Math.floor((max - min) * ratio);
};

function stringFormat(format: string, ...args: any[]): string {
    return format.replace(/{(\d+)}/g, (match, index) => {
        const argIndex = parseInt(index, 10);
        if (argIndex < args.length) {
            return args[argIndex];
        }
        return match;
    });
}

@ccclass('MainUI')
export class MainUI extends Component {

    @property(Number)
    cur_index: number = 1;

    @property(Node)
    particleNode: Node = null;

    @property(Node)
    mapNode: Node = null;

    @property(Node)
    playerNode: Node = null;

    @property(Node)
    plan: Node = null;

    @property(Node)
    yinNiSign: Node = null;

    @property(Node)
    baxiSign: Node = null;

    @property ({ type: Prefab })
    public itemPrefab: Prefab | null  = null;

    cache_move_count: number = 0;
    cache_forward_move_count: number = 0;
    cache_back_move_count: number = 0;

    isMoveing: boolean = false;

    @property(UserData)
    userDataInfo: UserData = null!;

    @property(Node)
    effectNode: Node = null!;

    @property(JsonAsset)
    eventConfig: JsonAsset = null!;

    @property(JsonAsset)
    groupConfig: JsonAsset = null!;

    @property(JsonAsset)
    randomEventConfig: JsonAsset = null!;

    @property(JsonAsset)
    signInConfig: JsonAsset = null!;

    @property(JsonAsset)
    contentConfig: JsonAsset = null!;

    @property(JsonAsset)
    paramConfig: JsonAsset = null!;

    public eventSlots: Node[] = [];
    public jsonCache : number[] = [];

    public eventGroupList : number[] = []; // 事件组缓存
    public eventSnList : number[] = []; // 事件index缓存
    
    videoCb :any = null;
    shareCb :any = null;
    isDoubbleScore: boolean = false;
    language :string = "pt_BR";
    token:string = "6883a821-05e8-42fd-9d89-8d4aad00721e";
    unionId :string = "";
    appVersion :string = "";
    env :string = "";

    shareGetStepCount:number = 3;
    todaySharedNum: number = 0;
    // todaySharedTime: number = 0;

    @property({
        type: Prefab
    })
    slotPrefab: Prefab = null!;
    @property({
        type: ScrollView
    })
    scrollView: ScrollView = null!;

    @property
    totalCount = 0;

    onLoad() {
        this.userDataInfo.init();
        // cc.sys.localStorage.removeItem('cur_index');
        // cc.sys.localStorage.removeItem('step');
        // cc.sys.localStorage.removeItem('score');
        // cc.sys.localStorage.removeItem('doubleStep');
        // cc.sys.localStorage.removeItem('doubleScore');

        // cc.sys.localStorage.removeItem('lastSignInTime');


        ks.authorize({
            scope: "scope.userInfo",
            success: () => {
                console.log("授权获取用户信息成功");
                ks.getUserInfo({
                    success: (result) => {
                        console.log("获取用户信息成功 json：" + result);
                        // console.log("获取用户信息成功：" + JSON.stringify(result));
                        let userInfo = result["userInfo"];
                        console.log("获取用户信息成功 userInfo：" + userInfo);
                        console.log("获取用户信息成功 unionID:" + userInfo["unionID"]);
                        this.unionId = userInfo["unionID"];
                        this.onUpdatePlayerHeadByUrl(userInfo["userHead"]);
                      },
                      fail: (error) => {
                          console.log("获取用户信息失败: " + JSON.stringify(error));
                      },
                      complete:() => {
                          console.log("获取用户信息完成");
                      }
                  });
            },
            fail: (error) => {
                console.log("授权获取用户信息失败: " + JSON.stringify(error));
            },
            complete:() => {
                console.log("授权获取用户信息完成");
            }
        });

        ks.getSystemInfo({
            success: (res)=> {
                let language = res["language"];
                this.language = language;
                this.appVersion = res["version"];
                let host = res["host"];
                this.env = host["env"];
                console.log("当前本地语言为：" + language);
            }
        });

        console.log("yjf_______登陆")
        ks.login({
            success: function(res) {
                console.log("yjf_______登陆成功");
              console.log(res.code);
            },
            fail: function(error) {
              console.error(error);
            },
            complete: function() {
              console.log("login complete");
            }
          });
        // ks.getSystemInfoSync({
        //     success: (res)=> {
        //         let language = res["language"];
        //         this.language = language;
        //         this.appVersion = res["version"];
        //         console.log("当前本地语言为：" + language);
        //     }
        // })
        this.language = "pt_BR"
        this.getToken();

        // 加载奖励信息
        this.cur_index = 1;
        let curIndex = parseInt(cc.sys.localStorage.getItem('cur_index'), 10);
        if (curIndex)
        {
            this.cur_index = curIndex;
        }

        let todaySharedNum = parseInt(cc.sys.localStorage.getItem('today_shared_num'), 10);
        if (todaySharedNum)
        {
            this.todaySharedNum = todaySharedNum;
        }

        if (this.cur_index>= this.totalCount)
        {
            this.cur_index = this.totalCount-1;
        }

        this.shareGetStepCount = this.getParam("today_shared_count");
        this.checkSignInData();
        cc.view.setResizeCallback(() => {
            this.onUpdatePlayerUi();
        });
    }

    start() {
        //隐藏分享界面
        let sharePanel = this.node.getChildByName("shared");
        sharePanel.active = false;

        let videoPanel = this.node.getChildByName("video");
        videoPanel.active = false;

        let shaizi = this.node.getChildByName("shaizi") as Node;
        if (shaizi)
        {
            shaizi.active = false;
        }

        let doubleShazi = this.node.getChildByName("doubleShaizi") as Node;
        if (doubleShazi)
        {
            doubleShazi.active = false;
        }

        let tipsNode = this.node.getChildByName("showTipsBg");
        if (tipsNode)
        {

            tipsNode.active = false;  
        }

        let signInPanel = this.node.getChildByName("signIn");
        if (signInPanel)
        {
            signInPanel.active = false;
        }

        let rewardPanel = this.node.getChildByName("rewardDialog");
        if (rewardPanel)
        {
            rewardPanel.active = false;
        }

        this.initMapInfo();
        this.initUiInfo();
        this.initRandomEvent();
        this.refreshSignInView();
        this.resetScrollOffset();
    }

    doubleStart()
    {
        // this.doubleShaiziNum = this.doubleShaiziNum - 1;
        this.userDataInfo.addDoubleStep(-1);
        this.onUpdateStepUi();
        let shaizi = this.node.getChildByName("doubleShaizi") as Node;
        if (shaizi)
        {
            shaizi.active = true;
        }
        let shazi01 = shaizi.getChildByName("shaizi_01");
        let shazi02 = shaizi.getChildByName("shaizi_02");
        let anim1 = shazi01.getComponent(cc.Animation);
        let anim2 = shazi02.getComponent(cc.Animation);
        if (anim1 && anim2){
            var random1 = getRandomInt(1, 7);
            var random2 = getRandomInt(1, 7);
            console.log("anim game");
            anim1.play('shaizi0' + random1);
            anim2.play('shaizi0' + random2);
            anim1.once(cc.Animation.EventType.FINISHED, ()=>{
                this.cache_move_count = random1 + random2;
                this.playerMove();
            }, this);
        }

        this.scheduleOnce(() => {
            // console.log("yjf_________!111111")
            shaizi.active = false;
            shaizi.emit('fade-out');
        }, 3);
    }

    onUpdatePlayerHeadByUrl(url)
    {
        // console.log("开始下载" + url);
        cc.assetManager.loadRemote(url, (err, imageAsset) => {
            console.log(err);
            if (!err) {
                // console.log("图片下载成功" + imageAsset);
                // 图像下载成功，可以将其设置为 Sprite 的纹理
                
                var sprite = this.playerNode.getComponent(Sprite);
                this.playerNode.setScale(0.7, 0.7, 0.7);
                // var textureSp = cc.textureCache.addImage(texture);
                // console.log("图片下载成功 textureSp" + textureSp);
                const spriteFrame = new SpriteFrame();
                const texture = new cc.Texture2D();
                texture.image = imageAsset;
                spriteFrame.texture = texture;

                sprite.spriteFrame = spriteFrame;
            }
        });
    }

    update(deltaTime: number) {
        // this.onShowCoinEffect();
    }
    // 点击开始游戏
    startGame() {
        let gameDoubleStep = this.userDataInfo.getDoubleStep();
        if (gameDoubleStep > 0)
        {
            this.startGameDouble();
            return;
        }

        let gameStep = this.userDataInfo.getStep();
        if (gameStep <= 0){
            return
        }
        if (this.isMoveing)
        {
            return;
        }
        this.resetScrollOffset();
        this.isMoveing = true;
        this.scheduleOnce(() => {
            this.realStartGame()
        }, 0.1);
    }

    // 点击开始游戏
    startGameDouble() {
        let gameStep = this.userDataInfo.getDoubleStep();
        if (gameStep <= 0){
            return
        }
        if (this.isMoveing)
        {
            return;
        }
        this.resetScrollOffset();
        this.isMoveing = true;
        this.scheduleOnce(() => {
            this.doubleStart();
        }, 0.1);
    }
    
    initRandomEvent() {
        let box = this.node.getChildByName("box");
        box.active = false;
        this.schedule(this.showRandomEvent, 60, macro.REPEAT_FOREVER);
    }

    // 显示随机事件
    showRandomEvent() {
        let box = this.node.getChildByName("box");
        // 已有奖励没点则不继续出
        if (box.active)
        {
            return;
        }
        box.active = true;
        let randomStartIndex = getRandomInt(1, 5);
        let randomEndIndex = getRandomInt(1, 5);
        let startNode = this.node.getChildByName("random_event_start" + randomStartIndex);
        let endNode = this.node.getChildByName("random_event_end" + randomEndIndex);
        box.setPosition(startNode.getPosition());
        // 移动player
        tween(box)
        .to(5, {position: endNode.getPosition()}, { easing: 'cubicInOut'})
        .call(() =>{
            
        }).start();
    }

    onClickRandomEvent() {
        let box = this.node.getChildByName("box");
        if (!box.active)
        {
            return;
        }
        const jsonData: object = this.randomEventConfig.json!;
        let keys = Object.keys(jsonData);

        let totalWeight = 0;
        for (let i = 0; i < keys.length; i++)
        {
            const element = jsonData[i];
            totalWeight = totalWeight + element.weight;
        }
        let randomPercent = Math.random();
        let randomValue = randomPercent * totalWeight;
        let curWeight = 0;
        var data = null;
        for (let i = 0; i < keys.length; i++)
        {
            const element = jsonData[i];
            curWeight = curWeight + element.weight;
            if (randomValue <= curWeight)
            {
                data = element;
                break;
            }
        }
        // this.showTips(data.tips);
        box.active = false;
        // 看视频获得积分
        if (data.type == 1){
            let callback = function(){
                if (this.userDataInfo.getDoubleScore() > 0)
                {
                    this.userDataInfo.addScore(10*2);
                }
                else
                {
                    this.userDataInfo.addScore(10);
                }
                this.onUpdateScoreUi();
                this.onShowCoinEffect();
            }.bind(this);
            this.showVideoDialog(this.getContentTxt("video_get_score"), callback);
        }
        else if (data.type == 2) {
            let callback = function(){
                this.userDataInfo.addStep(data.stepNum);
                this.onUpdateStepUi();
            }.bind(this);
            this.showVideoDialog(this.getContentTxt("video_get_step"), callback);
        }
        else if (data.type == 3) {
            let callback = function(){
                this.userDataInfo.addDoubleScore(data.duobleCoin)
            }.bind(this);
            this.showVideoDialog(this.getContentTxt("video_get_double_score"), callback);
        }
    }

    realStartGame()
    {
        this.userDataInfo.addStep(-1);
        this.onUpdateStepUi();
        let shaizi :any = null;
        shaizi = this.node.getChildByName("shaizi") as Node;
        if (shaizi)
        {
            shaizi.active = true;
        }
        let anim = shaizi.getComponent(cc.Animation);
        if (anim){
            var random = getRandomInt(1, 7);
            console.log("anim game");
            anim.play('shaizi0' + random);
            anim.once(cc.Animation.EventType.FINISHED, ()=>{
                this.scheduleOnce(() => {
                    this.cache_move_count = random;
                    this.playerMove();
                }, 1);
            }, this);
        }
        
        this.scheduleOnce(() => {
            // console.log("yjf_________!111111")
            shaizi.active = false;
            shaizi.emit('fade-out');
        }, 3);
    }

    initUiInfo(){
        this.initUiLanguage();
        this.initEventInfo();
        this.initScrollView();
        this.onUpdateStepUi();
        this.onUpdateScoreUi();
        this.onUpdatePlayerUi();
    }

    initUiLanguage() {
        // 放置奖励
        let rewardTitleNode = this.node.getChildByName("reward").getChildByName("reward_title");
        let rewardTitleCom = rewardTitleNode.getComponent(cc.Label);
        rewardTitleCom.string = this.getContentTxt("reward_title");
        // 获得次数
        let getNumNode = this.node.getChildByName("button_get_count").getChildByName("get_num");
        let getNumCom = getNumNode.getComponent(cc.Label);
        getNumCom.string = this.getContentTxt("get_num");

        //签到
        let signInPanel = this.node.getChildByName("signIn");
        let signInTitle = signInPanel.getChildByName("title");
        let signInTitleCom = signInTitle.getComponent(cc.Label);
        signInTitleCom.string = this.getContentTxt("sign_in_title");

        let signInHint = signInPanel.getChildByName("hint");
        let signInHintCom = signInHint.getComponent(cc.Label);
        signInHintCom.string = this.getContentTxt("sign_in_hint");

        let signInHint1 = signInPanel.getChildByName("hint1");
        let signInHint1Com = signInHint1.getComponent(cc.Label);
        signInHint1Com.string = this.getContentTxt("sign_in_hint1");

        for (let i = 1; i <= 7; i++)
        {
            let dayTitle = signInPanel.getChildByName("day" + i).getChildByName("title")
            let dayTitleCom = dayTitle.getComponent(cc.Label);
            dayTitleCom.string = this.getContentTxt("day" + i);
        }

        //分享
        let sharedPanel = this.node.getChildByName("shared")
        let sharedTitle = sharedPanel.getChildByName("title")
        let sharedTitleCom = sharedTitle.getComponent(cc.Label)
        sharedTitleCom.string = this.getContentTxt("dialog_reward_title");

        let ensureTxt = sharedPanel.getChildByName("ensure").getChildByName("ensure_txt");
        let ensureTxtCom = ensureTxt.getComponent(cc.Label);
        ensureTxtCom.string = this.getContentTxt("ensure_txt");

        let cancleTxt = sharedPanel.getChildByName("cancle").getChildByName("cancle_txt");
        let cancleTxtCom = cancleTxt.getComponent(cc.Label);
        cancleTxtCom.string = this.getContentTxt("cancle_txt");

        //视频
        let videoPanel = this.node.getChildByName("video")
        let videoTitle = videoPanel.getChildByName("title")
        let videoTitleCom = videoTitle.getComponent(cc.Label)
        videoTitleCom.string = this.getContentTxt("dialog_reward_title");

        let ensureTxt1 = videoPanel.getChildByName("ensure").getChildByName("ensure_txt");
        let ensureTxtCom1 = ensureTxt1.getComponent(cc.Label);
        ensureTxtCom1.string = this.getContentTxt("ensure_txt");

        let cancleTxt1 = videoPanel.getChildByName("cancle").getChildByName("cancle_txt");
        let cancleTxtCom1 = cancleTxt1.getComponent(cc.Label);
        cancleTxtCom1.string = this.getContentTxt("cancle_txt");

        //奖励
        let rewardPanel = this.node.getChildByName("rewardDialog")
        let rewardTitle1 = rewardPanel.getChildByName("title")
        let rewardTitleCom1 = rewardTitle1.getComponent(cc.Label)
        rewardTitleCom1.string = this.getContentTxt("dialog_reward_title");

        let ensureTxt2 = rewardPanel.getChildByName("ensure").getChildByName("ensure_txt");
        let ensureTxtCom2 = ensureTxt2.getComponent(cc.Label);
        ensureTxtCom2.string = this.getContentTxt("ensure_txt");

        let cancleTxt2 = rewardPanel.getChildByName("cancle").getChildByName("cancle_txt");
        let cancleTxtCom2 = cancleTxt2.getComponent(cc.Label);
        cancleTxtCom2.string = this.getContentTxt("cancle_txt");

    }

    initEventInfo() {
        // let layout = this.node.getChildByName("Layout");
        // let map = null;
        // if (layout)
        // {
        //     for (let index = 0; index < 9; index++) {
        //         let name = "map_0" + (index+1);
        //         console.log(name);
        //         map = layout.getChildByName(name) as Node;
        //         let imgName = "event01";
        //         let newSpriteFrame = resources.get('texture/' + imgName + '/spriteFrame', SpriteFrame);
        //         map.getComponent(Sprite)!.spriteFrame = newSpriteFrame;
        //     }
        // }
        // 要计算 HMAC 的密钥和消息
        const secretKey = 'your_secret_key';
        const message = 'your_message_to_hash';

        // // 计算 HMAC-SHA256
        // const hmacResult = CryptoJS.HmacSHA256(message, secretKey);

        // // // 将结果转换为十六进制字符串
        // const hexResult = hmacResult.toString(CryptoJS.enc.Hex);

        // console.log('HMAC-SHA256:', hexResult);

        const rst = CryptoES.HmacSHA256(message, secretKey);
        console.log(rst);
        console.log(rst.toString(CryptoES.enc.Hex));
        // 计算 HMAC-SHA256
        // console.log(SHA256('my message'));
 
        // const encryptedMessage = AES.encrypt('message', 'test').toString();
        // console.log(encryptedMessage);
        // console.log(CryptoTS.HmacSHA1("Message", "Key"));
        // const key = CryptoJS.HmacSHA256(message, secretKey);  // 秘钥
        // console.log(key);
        // 将结果转换为十六进制字符串
        // const hexResult = hmacResult.toString(CryptoJS.enc.Hex);

        // console.log('HMAC-SHA256:', hmacResult);
    }

    getContentTxt(sn){
        let data = ConfigUtil.getDataBySn(this.contentConfig, sn);
        if (this.language == "pt_BR")
        {
            return data.pt_BR;
        }
        else if (this.language == "id_ID")
        {
            return data.id_ID
        }
        return data.zn;
    }

    getParam(sn) {
        let data = ConfigUtil.getDataBySn(this.paramConfig, sn);
        return data.param
    }

    onUpdateScoreUi() {
        let scoreNode = this.node.getChildByName("score")

        if (scoreNode) {
            let scoreLable = scoreNode.getComponent(cc.Label)
            scoreLable.string = this.userDataInfo.getScore();
        }
    }

    onUpdateStepUi()　{
        let gameCountNode = this.node.getChildByName("game_count");
        let gameBtnNode = this.node.getChildByName("button_start");
        if (gameCountNode && gameBtnNode)
        {
            let gameCountLabel = gameCountNode.getComponent(cc.Label);
            let gameSprite = gameBtnNode.getComponent(cc.Button);
            let newSpriteFrame = null;
            let gameDoubleCount = this.userDataInfo.getDoubleStep();
            if (gameDoubleCount > 0)
            {
                gameCountLabel.string = gameDoubleCount;
                newSpriteFrame = resources.get('texture/button/shaizi2/spriteFrame', SpriteFrame);
            }
            else
            {
                gameCountLabel.string = this.userDataInfo.getStep();
                newSpriteFrame = resources.get('texture/button/shaizi1/spriteFrame', SpriteFrame);
            }
            gameSprite.normalSprite = newSpriteFrame;
            gameSprite.pressedSprite = newSpriteFrame;
            gameSprite.hoverSprite = newSpriteFrame;
        }

        // let gameDoubleCountNode = this.node.getChildByName("game_count_double");
        // if (gameDoubleCountNode)
        // {
        //     let gameDoubleCountLabel = gameDoubleCountNode.getComponent(cc.Label)
        //     gameDoubleCountLabel.string = this.userDataInfo.getDoubleStep();
        // }

    }

    onUpdatePlayerUi() {

        // let width = this.eventSlots[0].getComponent(UITransform).getContentSize().width;
        // console.log("yjf_______widtgh:" + width);
        console.log("yjf______this.cur_index: " + this.cur_index);
        let posX = this.eventSlots[this.cur_index-1].getPosition().x;
        let posY = this.eventSlots[this.cur_index-1].getPosition().y;
        this.playerNode.setPosition(posX, posY, 0);
    }

    getToken(){
        console.log("self outside :" + this);

        let self = this;
        ks.request({
            url: 'https://game.kwai.com/openapi/oauth/token', //仅为示例，并非真实的接口地址
            data: {
                grant_type:"client_credentials",
                client_id:"kwaix24ff2o0ni50",
                client_secret:"a27edf9441024c89a1dd677b94f246d4c0efc7bb"
            },
            method: "POST",
            header: {
                'content-type': 'application/x-www-form-urlencoded', // 默认值
            },
            success (res) {
                console.log(res.data);
                let token = res.data["access_token"];
                self.token = res.data["access_token"];
            }
            });
    }

    requestCoin() {

        let timeNow = Date.now();
        let stringA = "app_id=kwaix24ff2o0ni50&app_version="+this.appVersion+"&open_id="+ this.unionId
             +"&reward_id=example_1&biz_no=111&env=" + this.env + "&ts=" + timeNow;
        let appSecret = "a27edf9441024c89a1dd677b94f246d4c0efc7bb";
        const rst = CryptoES.HmacSHA256(appSecret, stringA);
        console.log(rst);
        console.log(rst.toString(CryptoES.enc.Hex));

        console.log("this.appVersion is  " + this.appVersion);
        console.log("this.env is  " + this.env);
        console.log("this.this.token is  " + this.token);
        console.log("this.timeNow  " + timeNow);
        ks.request({
            url: 'https://game.kwai.com/rest/o/game/kcoin/reward/access_token=' + this.token, //仅为示例，并非真实的接口地址
            data: {
                app_id:"kwaix24ff2o0ni50",
                app_version: this.appVersion,
                open_id: this.unionId,
                reward_id: "example_1",
                biz_no: "111",
                env: this.env,
                ts: timeNow,
                sign: rst,
            },
            method: "POST",
            header: {
                'content-type': 'application/json', // 默认值
            },
            success (res) {
                console.log(res.data);
            }
            });
    }

    onClickAddStepCount() {
        // let successCb = function()
        // {
        //     console.log("视频播放成功！！！！！！！！！！success");
        //     this.addStepCount(1);
        //     this.onUpdateStepUi();
        // }.bind(this);
        // this.showAd(successCb, null);
        // this.requestCoin();
        let todaySharedTime = cc.sys.localStorage.getItem('today_shared_time');
        var currentTimestampInSeconds = Math.floor(Date.now() / 1000);
        let isNextDay = this.isNextDay(currentTimestampInSeconds, todaySharedTime);
        if (!todaySharedTime || isNextDay) {
            this.todaySharedNum = 0;
        }
        if (this.todaySharedNum > this.shareGetStepCount)
        {
            this.showKsTips(this.getContentTxt("share_success"));
        }
        let successCb = function()
        {
            console.log("分享成功！！！！！！！！！！success");
            let getStepNum = this.getParam("today_shared_get_step");
            this.addStepCount(getStepNum);
            this.onUpdateStepUi();
            var currentTimestampInSeconds = Math.floor(Date.now() / 1000);
            cc.sys.localStorage.setItem('today_shared_time', currentTimestampInSeconds);

            this.todaySharedNum = this.todaySharedNum + 1;
            cc.sys.localStorage.setItem('today_shared_num', this.todaySharedNum);
        }.bind(this);
        this.showShare(successCb, null);
    }

    showShare(successCb, failCb){
        ks.shareAppMessage({
            success : ()=>{
                console.log("分享成功");
                if (successCb)
                {
                    this.showKsTips(this.getContentTxt("share_success"));
                    successCb();
                }
            }
        })
    }

    showAd(successCb, failCb) {
        let param = {};
        param.adUnitId = "ad_7e8b004740729fcd"//"从平台获取的广告id";
        let rewardedVideoAd = ks.createRewardedVideoAd(param);
        if (rewardedVideoAd) {
        rewardedVideoAd.onClose(res => {
            // 用户点击了【关闭广告】按钮
            if (res && res.isEnded) {
            // 正常播放结束，可以下发游戏奖励
                // this.addStepCount(1);
                if (successCb)
                {
                    console.log("视频播放成功！！！！！！！！！！");
                    this.showKsTips(this.getContentTxt("video_success"));
                    successCb();
                }
            }
            else {
                // 播放中途退出，不下发游戏奖励
                if (failCb)
                {
                    failCb();
                }
            }
        })
        rewardedVideoAd.onError(res => {
            // 激励视频广告Error事件
        })
            let p = rewardedVideoAd.show()
            p.then(function(result){
                // 激励视频展示成功
                console.log(`show rewarded video ad success, result is ${result}`)
            }).catch(function(error){
                // 激励视频展示失败
                console.log(`show rewarded video ad failed, error is ${error}`)
            })
        } else {
            console.log("创建激励视频组件失败");
        }
    }

    addStepCount(addStep:number) {
        this.userDataInfo.addStep(addStep);
        this.onUpdateStepUi();
    }

    playerMove() {
        console.log("yjf  playerMove")
        if (this.cache_move_count == 0)
        {
            this.finishMove();
            return;
        }
        let scrollView = this.node.getChildByName("scrollView");
        let map = null;
        if (scrollView)
        {
            map = this.eventSlots[this.cur_index - 1];
        }
        if (map)
        {
            // this.cur_index = 2;
            let player = this.playerNode;
            let nextPosX = player.getPosition().x;
            let nextPosY = player.getPosition().y;
            // console.log("yjf________this.cur_index:" + this.cur_index);
            if (this.cur_index <= this.totalCount)
            {
                let nextNode = this.eventSlots[this.cur_index];
                nextPosX = nextNode.getPosition().x
                nextPosY = nextNode.getPosition().y
                this.cache_move_count = this.cache_move_count - 1;
                // console.log("yjf_________this.cache_move_count:" + this.cache_move_count);
                tween(player)
                    .to(1, {position: new Vec3(nextPosX, nextPosY, 0)}, { easing: 'cubicInOut'})
                    .call(() =>{
                        // 移动player
                        if (this.cur_index >= this.totalCount)
                        {
                            this.finishMove();
                            return;
                        } 
                        this.playerMove();
                    }).start();
            }
            this.cur_index = this.cur_index + 1
            cc.sys.localStorage.setItem('cur_index', this.cur_index);  
        }
    }

    //向前一步走
    moveForward(){
        if (this.cache_forward_move_count <= 0)
        {
            this.finishMove();
            return;
        }

        this.isMoveing = true
        let player = this.playerNode;
        let nextPosX = player.getPosition().x;
        let nextPosY = player.getPosition().y;
        if (this.cur_index < this.totalCount)
        {
            let nextNode = this.eventSlots[this.cur_index];
            nextPosX = nextNode.getPosition().x
            nextPosY = nextNode.getPosition().y
            this.cache_move_count = this.cache_move_count - 1;
            // console.log("yjf_________this.cache_move_count:" + this.cache_move_count);
            // 移动player
            tween(player)
                .to(1, {position: new Vec3(nextPosX, nextPosY, 0)}, { easing: 'cubicInOut'})
                .call(() =>{
                    this.cur_index = this.cur_index + 1;
                    cc.sys.localStorage.setItem('cur_index', this.cur_index);
                    this.isMoveing = false;
                    this.cache_forward_move_count = this.cache_forward_move_count - 1;
                    this.moveForward();
                }).start();
        }
    }

    //向后一步走
    moveBack(){
        if (this.cache_back_move_count <= 0)
        {
            this.finishMove();
            return;
        }
        if (this.cur_index <= 1)
        {
            return;
        }

        this.isMoveing = true
        let player = this.playerNode;
        let nextPosX = player.getPosition().x;
        let nextPosY = player.getPosition().y;

        if (this.cur_index < this.totalCount)
        {
            let nextNode = this.eventSlots[this.cur_index-2];
            nextPosX = nextNode.getPosition().x
            nextPosY = nextNode.getPosition().y
            this.cache_move_count = this.cache_move_count - 1;
            // 移动player
            tween(player)
                .to(1, {position: new Vec3(nextPosX, nextPosY, 0)}, {easing: 'cubicInOut'})
                .call(() =>{
                    this.cur_index = this.cur_index - 1;
                    cc.sys.localStorage.setItem('cur_index', this.cur_index);
                    this.isMoveing = false;
                    this.cache_back_move_count = this.cache_back_move_count - 1;
                    this.moveBack();
                }).start();
        }
    }

    finishMove()
    {
        console.log("yjf___________finishMove");
        this.isMoveing = false;
        // const confData = this.jsonCache[this.cur_index-1];
        const jsonData: object = this.eventConfig.json!;
        let jsonIndex = this.jsonCache[this.cur_index-1];

        let sn = this.eventSnList[this.cur_index-1];
        let eventData = ConfigUtil.getDataBySn(this.eventConfig, sn);
        this.triggerEvent(eventData);
        // console.log("yjf_______jsonData[jsonIndex].type:" + eventData.type);
        
        // this.showTips(eventData.tips);
        this.onUpdateScoreUi();

        if (this.cur_index >= this.totalCount)
        {
            this.finishGame();
        }
    }

    triggerEvent(eventData)
    {
        console.log("yjf______eventData type:" + eventData.type);
        if (eventData.type == 1) //前进
        {
            this.cache_forward_move_count = eventData.forwardNum;
            this.moveForward();
            // 
            this.showTips(stringFormat(this.getContentTxt("move_forward"), eventData.forwardNum));
        }
        else if (eventData.type == 2) //后退
        {
            this.cache_back_move_count = eventData.backwardNum;
            this.moveBack();
            this.showTips(stringFormat(this.getContentTxt("move_back"), eventData.backwardNum));
        }
        else if (eventData.type == 3) //获得投掷次数
        {
            this.userDataInfo.addStep(eventData.stepNum);
            this.onUpdateStepUi();
            this.showTips(stringFormat(this.getContentTxt("get_step_num"), eventData.stepNum));
        }
        else if (eventData.type == 4) //双倍积分
        {
            this.userDataInfo.addDoubleScore(eventData.duobleCoin);
            this.showTips(stringFormat(this.getContentTxt("get_double_score_num"), eventData.duobleCoin));
        }
        else if (eventData.type == 5) //双倍骰子
        {
            this.userDataInfo.addDoubleStep(eventData.doubleDice);
            this.onUpdateStepUi();
            this.showTips(stringFormat(this.getContentTxt("get_double_step_num"), eventData.doubleDice));
        }
        else if (eventData.type == 6) //分享获得次数
        {
            let callBack = function(){
                console.log("分享获得次数");
                this.userDataInfo.addStep(eventData.stepNum);
                this.onUpdateStepUi();
            }.bind(this)
            this.showSharedDialog(this.getContentTxt("share_get_step"), callBack);
        }
        else if (eventData.type == 7) //分享获得双倍骰子
        {
            let callBack = function(){
                console.log("分享获得双倍骰子");
                this.userDataInfo.addDoubleStep(eventData.doubleDice);
                this.onUpdateStepUi();
            }.bind(this)
            this.showSharedDialog(this.getContentTxt("share_get_double_step"), callBack);
        }
        else if (eventData.type == 8) //看视频获得积分
        {
            let callback = function(){
                console.log("获得积分");
                if (this.userDataInfo.getDoubleScore() > 0)
                {
                    this.userDataInfo.addScore(10*2);
                }
                else
                {
                    this.userDataInfo.addScore(10);
                }
                this.onUpdateScoreUi();
                this.onShowCoinEffect();
            }.bind(this);
            this.showVideoDialog(this.getContentTxt("share_get_score"), callback);
        }
        else if (eventData.type == 9) //看视频获得双倍骰子
        {
            let callback = function(){
                console.log("获得双倍骰子");
                this.userDataInfo.addDoubleScore(eventData.doubleDice);
                this.onUpdateStepUi();
            }.bind(this);
            this.showVideoDialog(this.getContentTxt("video_get_double_step"), callback);
        }
    }

    showTips(content:string)
    {
        let tipsBg = this.node.getChildByName("showTipsBg") as Node;
        let tipsNode = tipsBg.getChildByName("tips");
        if (tipsNode)
        {
            tipsBg.active = true;
            tipsNode.getComponent(cc.Label).string = content;
            tipsBg.setPosition(0, 1192, tipsBg.getPosition().z);
            tween(tipsBg)
                .to(1, {position: new Vec3(tipsBg.getPosition().x, 
                    tipsBg.getPosition().y + 100, 0)}, { easing: 'cubicOut'})
                .call(() =>{
                }).start();

            this.scheduleOnce(() => {
                tipsBg.active = false;
            }, 2);
        }
    }

    finishGame()
    {
        this.initMapInfo();
        this.initScrollView();
        this.cur_index = 1;
        cc.sys.localStorage.setItem('cur_index', this.cur_index);
        this.resetScrollOffset();
        this.onUpdatePlayerUi();
        if (this.userDataInfo.getDoubleScore()>0) 
        {
            this.userDataInfo.addDoubleScore(-1);
            this.userDataInfo.addScore(100*2);
        }
        else
        {
            this.userDataInfo.addScore(100);
        }
        this.showTips(this.getContentTxt("game_over"));
        this.onUpdateScoreUi();
        this.onShowCoinEffect();
    }

    onShowCoinEffect()
    {
        let particleSystem = this.particleNode.getComponent(ParticleSystem)
        particleSystem.play()
    }
    //
    initMapInfo() {
        this.eventGroupList = [];
        this.eventSnList = [];
        this.eventGroupList.push(11);
        this.eventSnList.push(1101);
        for (let eventIndex = 1; eventIndex < this.totalCount-1; eventIndex++)
        {
            // 先随机出组
            let totalGroupWeight = 0;
            const groupJsonData: object = this.groupConfig.json!;
            let keys = Object.keys(groupJsonData);
            let resultGroupIndex = 0;
            for (let i = 0; i < keys.length; i++)
            {
                totalGroupWeight = totalGroupWeight + groupJsonData[i].weigth;
            }
            let groupPercent = Math.random();
            // console.log("yjf______groupPercent：" + groupPercent);
            let curGroupWeight = groupPercent * totalGroupWeight;
            let temGrouppWeight = 0;
            // console.log("yjf______curGroupWeight：" + curGroupWeight);
            // console.log("yjf______totalGroupWeight：" + totalGroupWeight);
            for (let i = 0; i < keys.length; i++)
            {
                temGrouppWeight = temGrouppWeight + groupJsonData[i].weigth;
                if (curGroupWeight <= temGrouppWeight)
                {
                    resultGroupIndex = groupJsonData[i].group;
                    break;
                }
            }
            // console.log("yjf______resultGroupIndex：" + resultGroupIndex);
            this.eventGroupList.push(resultGroupIndex);

            // 随机出组内事件
            let eventList = ConfigUtil.getDataByKey(this.eventConfig, "group", resultGroupIndex);
            if (eventList)
            {
                let totalEventWeight = 0;
                let temEventWeight = 0;
                let randomEventPercent = Math.random();
                // console.log("yjf_______randomEventPercent:" + randomEventPercent)
                for (let tempIndex = 0; tempIndex < eventList.length; tempIndex++)
                {
                    let eventElement = eventList[tempIndex];
                    var weight = eventElement.weight;
                    // console.log("yjf_______event weight:" + weight)
                    if (eventIndex > 2)
                    {
                        if (this.eventGroupList[eventIndex] == this.eventGroupList[eventIndex-1] 
                            && eventElement.sn == this.eventSnList[eventIndex-1])
                        {
                            let pre1 = 1;
                            // 100-10*pre1
                            weight = weight - weight*pre1;
                        }
                        else if (this.eventGroupList[eventIndex] == this.eventGroupList[eventIndex-2] 
                            && eventElement.sn == this.eventSnList[eventIndex-2])
                        {
                            let pre2 = 0.5;
                            weight = weight - weight*pre2;
                        }
                    }
                    else if (eventIndex == 1)
                    {
                        if (this.eventGroupList[eventIndex] == this.eventGroupList[eventIndex-1] 
                            && eventElement.sn == this.eventSnList[eventIndex-1])
                        {
                            let pre1 = 1;
                            weight = weight - pre1*weight;
                        }
                    }
                    // console.log("yjf_______event result weight:" + weight)
                    totalEventWeight = totalEventWeight + weight;
                }
                let curEventWeight = randomEventPercent * totalEventWeight;
                // console.log("yjf_______totalEventWeight:" + totalEventWeight)
                // console.log("yjf_______curEventWeight:" + curEventWeight)
                for (let groupEventIndex = 0; groupEventIndex < eventList.length; groupEventIndex++)
                {
                    let eventElement = eventList[groupEventIndex];
                    var weight = eventElement.weight;
                    if (eventIndex > 2)
                    {
                        // console.log("yjf_______this.eventGroupList[eventIndex]:" + this.eventGroupList[eventIndex])
                        // console.log("yjf_______this.eventGroupList[eventIndex-1]:" + this.eventGroupList[eventIndex-1])
                        // console.log("yjf_______this.eventSnList[eventIndex-1]:" + this.eventSnList[eventIndex-1])
                        // console.log("yjf_______eventElement.sn:" + eventElement.sn)
                        if (this.eventGroupList[eventIndex] == this.eventGroupList[eventIndex-1] 
                            && eventElement.sn == this.eventSnList[eventIndex-1])
                        {
                            let pre1 = 1;
                            // 100-10*pre1
                            weight = weight - weight*pre1;
                        }
                        else if (this.eventGroupList[eventIndex] == this.eventGroupList[eventIndex-2] 
                            && eventElement.sn == this.eventSnList[eventIndex-2])
                        {
                            let pre2 = 0.5;
                            weight = weight - pre2*weight;
                        }
                    }
                    else if (eventIndex == 2)
                    {
                        if (this.eventGroupList[eventIndex] == this.eventGroupList[eventIndex-1] 
                            && eventElement.sn == this.eventSnList[eventIndex-1])
                        {
                            let pre1 = 1;
                            weight = weight - pre1*weight;
                        }
                    }
                    temEventWeight = temEventWeight + weight;
                    if (curEventWeight <= temEventWeight)
                    {
                        this.eventSnList.push(eventElement.sn);
                        break;
                    }
                }
            }
        }
        if (this.eventSnList.length == 48)
        {
            this.eventSnList.push(901);
        }
        //结束点
        this.eventGroupList.push(10);
        this.eventSnList.push(1001);
        // console.log("yjf_________eventGroupList:" + this.eventGroupList);
        // console.log("yjf_________eventSnList:" + this.eventSnList);
    }
    
    // 初始化地图
    initScrollView() {
        // this.scrollView.content!.removeAllChildren();
        this.eventSlots.length = 0;
        let imgName = "";
        if (this.language == "pt_BR")
        {
            this.baxiSign.active = true;
            this.yinNiSign.active = false;
            imgName = "baxi_plan"
        }
        else
        {
            this.baxiSign.active = false;
            this.yinNiSign.active = true;
            imgName = "yinni_plan"
        }
        let planCom = this.plan.getComponent(Sprite);
        let newSpriteFrame = resources.get('texture/bg/' + imgName + '/spriteFrame', SpriteFrame);
        let sprite = this.node.getComponent(Sprite);
        planCom.spriteFrame = newSpriteFrame

        for (let i = 0; i < this.totalCount; i++) {

            let eventSlot = this.addEventSlot(i);
            this.eventSlots.push(eventSlot);
        }
    }

    addEventSlot(index) {
        let sn = this.eventSnList[index];
        const jsonData: object = this.eventConfig.json!;
        let plan = this.plan;
        let eventSlot = plan.getChildByName("floor-" + (index+1));
        // console.log("yjf________index:"+index);
        // console.log("yjf________sn:"+sn);
        // eventSlot.setPosition(eventSlot.getPosition().x, eventSlot.getPosition().y);
        let eventData = ConfigUtil.getDataBySn(this.eventConfig, sn);
        (eventSlot.getComponent('EventSlot') as EventSlot)!.init(eventData);
        this.jsonCache.push(index);
        return eventSlot;
    }
    // 恢复地图位置（开始以游戏后）
    resetScrollOffset() {
        console.log("yjf_______this.scrollView:" + this.scrollView.getScrollOffset());

        // let posY = this.eventSlots[this.cur_index-1].getPosition().y;
        // this.scrollView.scrollToOffset(new Vec2(0, posY), 1);
        let offset = this.scrollView.getScrollOffset();
        let maxScroll = this.scrollView.getMaxScrollOffset();
        let posY = this.eventSlots[this.cur_index-1].getPosition().y;
        let pos = maxScroll.y - posY + 200;
        this.scrollView.scrollToOffset(new Vec2(0, pos), 1);
    }

    //初始化签到数据
    initSignPanel(){
        let signInNode = this.node.getChildByName("signIn");
        if (!signInNode)
        {
            return;
        }


        let dataJson = this.signInConfig.json!;
        for (let i = 1; i <= 7; i++)
        {
            let data = dataJson[i];
            let dayNode = signInNode.getChildByName("day" + i);
            let bgSprite = dayNode.getChildByName("Sprite");
            let receiveBtn = dayNode.getChildByName("receive");
            let hasReceive = dayNode.getChildByName("has_receive");
            let bgSpriteCom = bgSprite.getComponent(Sprite);

            let imgName = data.image;
            let newSpriteFrame = resources.get('texture/' + imgName + '/spriteFrame', SpriteFrame);
            bgSpriteCom.spriteFrame = newSpriteFrame
        }
    }

    // 刷新签到页面
    refreshSignInView(){
        let signInPanel = this.node.getChildByName("signIn")
        for (let i = 1; i <= 7; i++)
        {
            let dayNode = signInPanel.getChildByName("day" + i);
            let receiveImg = dayNode.getChildByName("has_receive");
            let blackBg = dayNode.getChildByName("bg1back");
            let saveData = cc.sys.localStorage.getItem('signIn' + i);
            if (saveData)
            {
                blackBg.active = true;
                receiveImg.active = true;
            }
            else
            {
                blackBg.active = false;
                receiveImg.active = false;
            }
        }
    }

    refreshRewardPanel(){
        let result = this.calculateRewardNum();
        let rewardPanel = this.node.getChildByName("rewardDialog");
        let content = rewardPanel.getChildByName("content");
        let contentCom = content.getComponent(cc.Label);
        contentCom.string = stringFormat(this.getContentTxt("reward_content"), result);
    }

    calculateRewardNum() {
        let time = cc.sys.localStorage.getItem('rewardTime');
        var currentTimestampInSeconds = Math.floor(Date.now() / 1000);
        let diffTime = currentTimestampInSeconds - time;
        console.log("yjf__________diffTime:" + diffTime);
        let maxCount = 10;
        let interval = 2.5*60*60;
        let receiveStepCount = 3;
        let result = 0
        if (diffTime > interval)
        {
            result = Math.min(Math.floor(diffTime/interval)*receiveStepCount, maxCount);
        }
        return result;
    }

    showKsTips(str){
        ks.showToast({
            title: str,
            icon: 'success',
            duration: 2000
          })
    }


    // 点击签到
    onClickSignIn(){
        let signInPanel = this.node.getChildByName("signIn");
        signInPanel.setScale(1, 1, 1);
        signInPanel.active = true;
        // this.finishGame();
    }

    // 展示分享界面
    showSharedDialog(str, callback){
        let sharePanel = this.node.getChildByName("shared");
        let content = sharePanel.getChildByName("content");
        let contentCom = content.getComponent(cc.Label);
        contentCom.string = str;
        sharePanel.setScale(1, 1, 1);
        sharePanel.active = true; 

        this.shareCb = callback;
    }

    // 点击分享关闭
    onClickShareClose()
    {
        let sharePanel = this.node.getChildByName("shared");
        sharePanel.setScale(0, 0, 0);
        sharePanel.active = false;
    }

    // 点击分享确认
    onClickShareEnsure()
    {
        // this.showTips("分享成功");
        this.showShare(this.shareCb, null);
        this.onClickShareClose();
    }

    // 展示视频界面
    showVideoDialog(str, callback){
        this.videoCb = callback
        let videoPanel = this.node.getChildByName("video");
        let content = videoPanel.getChildByName("content");
        let labelCom = content.getComponent(cc.Label);
        labelCom.string = str;
        videoPanel.setScale(1, 1, 1);
        videoPanel.active = true; 
    }

    // 点击视频关闭
    onClickVideoClose()
    {
        console.log("yjf___________video");
        let videoPanel = this.node.getChildByName("video");
        videoPanel.setScale(0, 0, 0);
        videoPanel.active = false;
    }

    // 点击视频
    onClickVideoEnsure()
    {
        // this.showTips("视频");
        this.onClickVideoClose();
        this.showAd(this.videoCb, null);
    }

    onClickReward()
    {
        this.refreshRewardPanel();
        let rewardPanel = this.node.getChildByName("rewardDialog");
        rewardPanel.setScale(1, 1, 1);
        rewardPanel.active = true; 
    }

    onClickRewardCancle()
    {
        let rewardPanel = this.node.getChildByName("rewardDialog");
        rewardPanel.setScale(0, 0, 0);
        rewardPanel.active = false;
    }

    onClickRewardEnsure()
    {
        let result = this.calculateRewardNum();
        this.addStepCount(result);
        this.onUpdateStepUi();
        this.onClickRewardCancle();
        if (result > 0)
        {
            var currentTimestampInSeconds = Math.floor(Date.now() / 1000);
            cc.sys.localStorage.setItem('rewardTime', currentTimestampInSeconds);
        }
    }

    // 点击签到关闭
    onClickSignInClose()
    {
        let signInPanel = this.node.getChildByName("signIn");
        signInPanel.active = false;
        signInPanel.setScale(0, 0, 0);
    }

    checkReceiveSignInReward(index)
    {
        if (index > 1)
        {
            let signInValue = cc.sys.localStorage.getItem('signIn' + (index - 1));
            if (!signInValue)
            {
                return false;
            }
        }

        let lastSignInTime = cc.sys.localStorage.getItem('lastSignInTime');
        console.log("yjf_____lastSignInTime:" + lastSignInTime);
        if (!lastSignInTime)
        {
            return true;
        }
        var currentTimestampInSeconds = Math.floor(Date.now() / 1000);
        let isNextDay = this.isNextDay(currentTimestampInSeconds, lastSignInTime);
        return isNextDay;
    }

    isNextDay(currentTimestampInSeconds, savedTimestampInSeconds)
    {
                // 将时间戳转换为日期对象
        var currentDate = new Date(currentTimestampInSeconds * 1000);
        var savedDate = new Date(savedTimestampInSeconds * 1000);

        // 获取日期部分（年、月、日）并比较
        var currentYear = currentDate.getFullYear();
        var currentMonth = currentDate.getMonth();
        var currentDay = currentDate.getDate();

        var savedYear = savedDate.getFullYear();
        var savedMonth = savedDate.getMonth();
        var savedDay = savedDate.getDate();

        var isNextDay = (currentYear !== savedYear || currentMonth !== savedMonth || currentDay !== savedDay);

        return isNextDay;
    }

    onClickSignInDay1()
    {
        console.log("yjf_____________signIn1");
        let canReceive = this.checkReceiveSignInReward(1);
        console.log("yjf_____________signIn1:" + canReceive)
        if (!canReceive)
        {
            return;
        }

        let data = ConfigUtil.getDataBySn(this.signInConfig, 1);
        console.log("yjf_____data:" + data);
        this.triggerEvent(data);

        cc.sys.localStorage.setItem('signIn1', "true");
        var currentTimestampInSeconds = Math.floor(Date.now() / 1000);
        cc.sys.localStorage.setItem('lastSignInTime', currentTimestampInSeconds);

        this.refreshSignInView();
    }

    onClickSignInDay2()
    {   
        let canReceive = this.checkReceiveSignInReward(2);
        if (!canReceive)
        {
            return;
        }

        let data = ConfigUtil.getDataBySn(this.signInConfig, 2);
        this.triggerEvent(data);
        cc.sys.localStorage.setItem('signIn2', "true");
        var currentTimestampInSeconds = Math.floor(Date.now() / 1000);
        cc.sys.localStorage.setItem('lastSignInTime', currentTimestampInSeconds);

        this.refreshSignInView();
    }

    onClickSignInDay3()
    {
        let canReceive = this.checkReceiveSignInReward(3);
        if (!canReceive)
        {
            return;
        }

        let data = ConfigUtil.getDataBySn(this.signInConfig, 3);
        this.triggerEvent(data);
        cc.sys.localStorage.setItem('signIn3', "true");
        var currentTimestampInSeconds = Math.floor(Date.now() / 1000);
        cc.sys.localStorage.setItem('lastSignInTime', currentTimestampInSeconds);

        this.refreshSignInView();
    }
    onClickSignInDay4()
    {
        let canReceive = this.checkReceiveSignInReward(4);
        if (!canReceive)
        {
            return;
        }

        let data = ConfigUtil.getDataBySn(this.signInConfig, 4);
        this.triggerEvent(data);
        cc.sys.localStorage.setItem('signIn4', "true");
        var currentTimestampInSeconds = Math.floor(Date.now() / 1000);
        cc.sys.localStorage.setItem('lastSignInTime', currentTimestampInSeconds);
        this.refreshSignInView();
    }
    onClickSignInDay5()
    {
        let canReceive = this.checkReceiveSignInReward(5);
        if (!canReceive)
        {
            return;
        }

        let data = ConfigUtil.getDataBySn(this.signInConfig, 5);
        this.triggerEvent(data);
        cc.sys.localStorage.setItem('signIn5', "true");
        var currentTimestampInSeconds = Math.floor(Date.now() / 1000);
        cc.sys.localStorage.setItem('lastSignInTime', currentTimestampInSeconds);
        this.refreshSignInView();
    }
    onClickSignInDay6()
    {
        let canReceive = this.checkReceiveSignInReward(6);
        if (!canReceive)
        {
            return;
        }

        let data = ConfigUtil.getDataBySn(this.signInConfig, 6);
        this.triggerEvent(data);
        cc.sys.localStorage.setItem('signIn6', "true");
        var currentTimestampInSeconds = Math.floor(Date.now() / 1000);
        cc.sys.localStorage.setItem('lastSignInTime', currentTimestampInSeconds);
        this.refreshSignInView();
    }
    onClickSignInDay7()
    {
        let canReceive = this.checkReceiveSignInReward(7);
        if (!canReceive)
        {
            return;
        }

        let data = ConfigUtil.getDataBySn(this.signInConfig, 7);
        this.triggerEvent(data);
        cc.sys.localStorage.setItem('signIn7', "true");
        var currentTimestampInSeconds = Math.floor(Date.now() / 1000);
        cc.sys.localStorage.setItem('lastSignInTime', currentTimestampInSeconds);

        this.refreshSignInView();
    }

    checkSignInData()
    {
        let signIn7 = cc.sys.localStorage.getItem('signIn7');
        let lastSignInTime = cc.sys.localStorage.getItem('lastSignInTime');
        var currentTimestampInSeconds = Math.floor(Date.now() / 1000);
        let isNextDay = this.isNextDay(currentTimestampInSeconds, lastSignInTime);
        if (signIn7 && isNextDay)
        {
            for (let i = 1; i <= 7; i++)
            {
                cc.sys.localStorage.removeItem('signIn' + i);
            }
        }
    }
}


