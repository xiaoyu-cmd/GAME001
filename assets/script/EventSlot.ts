import { _decorator, Component, Node, Sprite, resources, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EventSlot')
export class EventSlot extends Component {
    @property(Sprite)
    public icon: Sprite = null!;
    start() {

    }

    update(deltaTime: number) {
        
    }

    init(data){
        console.log("yjf____slot data" + data);
        let imgName = data.icon;
        let newSpriteFrame = resources.get('texture/icon/' + imgName + '/spriteFrame', SpriteFrame);
        // let newSpriteFrame = resources.get('texture/icon/back1/spriteFrame', SpriteFrame);
        let sprite = this.node.getComponent(Sprite);
        sprite.spriteFrame = newSpriteFrame
    }
}


