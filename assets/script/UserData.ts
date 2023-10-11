import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UserData')
export class UserData extends Component {

    private mScore = 0;
    private mStep  = 3;
    private mDoubleStep = 0;
    private mDoubleScore = 0;

    start() {

    }

    init(){
        let time = cc.sys.localStorage.getItem('rewardTime');
        console.log("yjf__________time:" + time);
        if (!time)
        {
            // var currentDate = new Date();
            // var currentSecond = currentDate.getSeconds();
            var currentTimestampInSeconds = Math.floor(Date.now() / 1000);
            cc.sys.localStorage.setItem('rewardTime', currentTimestampInSeconds);
            console.log("yjf__________currentTimestampInSeconds:" + currentTimestampInSeconds);
        }


        this.mScore = 0;
        this.mStep = 3;
        this.mDoubleStep = 0;
        this.mDoubleScore = 0;

        let saveScore = parseInt(cc.sys.localStorage.getItem('score'), 10);
        let saveStep = parseInt(cc.sys.localStorage.getItem('step'), 10);
        let saveDoubleScore = parseInt(cc.sys.localStorage.getItem('doubleScore'), 10);
        let saveDoubleStep = parseInt(cc.sys.localStorage.getItem('doubleStep'), 10);

        if (saveScore)
        {
            this.mScore = saveScore;
        }
        if (saveStep)
        {
            this.mStep = saveStep;
        }
        if (saveDoubleScore)
        {
            this.mDoubleScore = saveDoubleScore;
        }
        if (saveDoubleStep)
        {
            this.mDoubleStep = saveDoubleStep;
        }
    }

    update(deltaTime: number) {
        
    }

    addScore(score:number){
        this.mScore = this.mScore + score;
        cc.sys.localStorage.setItem('score', this.mScore);
    }

    clearScore(score:number){
        this.mScore = 0;
    }

    addStep(step:number){
        this.mStep = this.mStep + step;
        cc.sys.localStorage.setItem('step', this.mStep);
    }

    addDoubleStep(step:number){
        this.mDoubleStep = this.mDoubleStep + step;
        cc.sys.localStorage.setItem('doubleStep', this.mDoubleStep);
    }

    addDoubleScore(score:number){
        this.mDoubleScore = this.mDoubleScore + score;
        cc.sys.localStorage.setItem('doubleScore', this.mDoubleScore);
    }

    getScore() {
        return this.mScore;
    }

    getStep() {
        return this.mStep;
    }

    getDoubleStep(){
        return this.mDoubleStep;
    }

    getDoubleScore(){
        return this.mDoubleScore;
    }

    checkSignInData() {
        
    }
}


