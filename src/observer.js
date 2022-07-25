import Dep from "./dep";

export default class Observer {
    constructor(data) {
        this.data = data;
        // 遍历对象完成所有数据的劫持
        this.walk(this.data);
    }

    /**
     * 遍历对象
     * @param {*} data
     */    
    walk(data) {
        // data必须是一个对象
        if (!data || typeof data !== 'object') {
            return;
        }
        // 获取data中的所有属性并循环遍历
        // 给每个属性都做 数据劫持
        Object.keys(data).forEach(key => {
            this.defineReactive(data, key, data[key]);
        })
    }

    /**
     *动态设置响应式数据，给里面的Object.defineProperty提供一个闭包环境
     * @param {*} data
     * @param {*} key
     * @param {*} val
     */
    defineReactive(data, key, val) {
        // 创建Dep类的实例
        // 每一个Observer的实例身上，都有一个Dep
        let dep = new Dep();

        // Object.defineProperty() 第一个参数表示定义哪个对象，第二个参数表示要定义或修改的属性的名称
        // 第三个参数表示要定义或修改的属性描述
        Object.defineProperty(data, key, {
            // 使该属性可枚举，可遍历
            enumerable: true,
            // 使该属性可改变
            configurable: true,
            // 属性的 getter 函数，当访问该属性时会被调用
            // 执行时不传入任何参数，返回值会被用作属性的值
            get: () => {
                // 由于需要在闭包内添加watcher，所以通过Dep定义一个全局target属性，暂存watcher, 添加完移除
                // 判断是否需要添加订阅者，若需要则添加
                Dep.target && dep.addSub(Dep.target);
                return val;
            },
            // 属性的 setter 函数，当属性值被修改时会被调用
            // 接收 被赋予的新值 作为 传入参数
            set: (newValue) => {
                if (val === newValue) return;
                console.log('监听到值变化了');
                val = newValue;
                // 数据已发生变化，通知所有订阅者
                dep.notify();
            }
        });

        // 监听子属性
        this.walk(val);
    }
}