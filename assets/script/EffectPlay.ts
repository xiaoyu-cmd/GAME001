import { _decorator, Component, Node } from 'cc';
import { resourceUtil } from "./resourceUtil";
const { ccclass, property } = _decorator;

@ccclass('EffectPlay')
export class EffectPlay extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }

    play(){
        //显示获得金币的特效
        resourceUtil.getEffect('coin', (err, prefab)=>{
            if (err) {
                console.error(err);
            }

            let coin = instantiate(prefab!);
            coin.parent = this.node;
            // this.addChild
            // this.node.addChild(coin);
            coin.setWorldPosition(this.node.getWorldPosition());
            this.scheduleOnce(()=>{
                coin.destroy();
            }, 2);
        });
    }
}


