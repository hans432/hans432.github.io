import Dep from "./dep";

var $uid = 0;
export default class Watcher {
    constructor(exp, scope, cb) {
        this.exp = exp;
        this.scope = scope;
        this.cb = cb;
        this.uid = $uid++;
        this.update();
    }

    /**
     * 计算表达式
     */
    get() {
        // 缓存自己
        Dep.target = this;
        // 这里会触发属性的getter，从而添加订阅者
        let newValue = Watcher.computeExpression(this.exp, this.scope);
        // 释放自己
        Dep.target = null;
        return newValue;
    }

    /**
     * 完成回调函数的调用
     */
    update() {
        let newValue = this.get();
        this.cb && this.cb(newValue);
    }

    static computeExpression(exp, scope) {
        // 创建函数
        // 把scope当作作用域
        // 函数内部使用with()来指定作用域
        // 执行函数，得到表达式的值
        let fn = new Function("scope", "with(scope){return " + exp + "}");
        return fn(scope);
    }
}