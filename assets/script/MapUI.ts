import { _decorator, Component, Prefab, ScrollView, Node, instantiate, JsonAsset } from "cc";
import { EventSlot } from "./EventSlot";
import { UserData } from "./UserData";
import { MainUI } from "./MainUI";
const { ccclass, property } = _decorator;


const getRandomInt = function (min: number, max: number) {
    var ratio = Math.random();
    return min + Math.floor((max - min) * ratio);
};
@ccclass('MapUI')
export class MapUI extends Component {

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

    @property(JsonAsset)
    eventConfig: JsonAsset = null!;

    @property(Node)
    mainNode: Node = null;

    public eventSlots: Node[] = [];

    cache_move_count = 0;

    isMoveing: boolean = false;

    @property(Number)
    cur_index: number = 1;

    userDataInfo : UserData = null!;
    mainUI : MainUI = null!;

    start() {
        this.userDataInfo = this.mainNode.getComponent(UserData) as UserData
        this.mainUI = this.mainNode.getComponent(MainUI) as MainUI
        this.init();
    }

    update(deltaTime: number) {
        
    }

    

    playerMove(moveCount?) {
        if (moveCount)
        {
            this.cache_move_count = moveCount;
        }
        if (this.cache_move_count == 0)
        {
            this.finishMove();
            return;
        }

        this.cache_move_count = this.cache_move_count - 1;
        let scrollView = this.node.getChildByName("scrollView");
        let map = null;
        if (scrollView)
        {
            let name = "map_0" + this.cur_index;
            console.log(name);
            map = this.eventSlots[this.cur_index - 1];
        }
        if (map)
        {
            let player = scrollView.getChildByName("player") as Node;
            if (player)
            {
                console.log("yjf_____player");
            }
            let anim = player.getComponent(cc.Animation);
            if (anim)
            {
                console.log("yjf_____anim");
            }
            let animIndex = this.cur_index % 9;
            anim.play('player_move_0' + this.cur_index);
            anim.once(cc.Animation.EventType.FINISHED, ()=>{
                console.log("yjf_______anim finish :" + this.cur_index);
                this.playerMove();
            }, this);
            if (this.cur_index == totalCount)
            {
                this.cur_index = 1
            }
            else
            {
                this.cur_index = this.cur_index + 1
            }
        }
    }

    finishMove()
    {
        this.isMoveing = false;
        this.userDataInfo.addScore(10);
        this.mainUI.onUpdateScoreUi();
        // this.onShowCoinEffect();
    }
}


