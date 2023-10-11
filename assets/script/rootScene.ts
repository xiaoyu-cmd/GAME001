import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NewComponent')
export class NewComponent extends Component {
    start() {
        console.log("yjf__________1111111111111111111");
    }

    update(deltaTime: number) {
        console.log("yjf__________22222222222222222222");
    }
}


