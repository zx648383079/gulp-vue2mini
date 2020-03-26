<template>
    <div class="swipe-box">
        <slot></slot>
    </div>
</template>
<script lang="ts">
import { SwipeRow } from "./index.vue";
import { WxComponent, WxJson, WxMethod } from "../../../typings/wx/lib.vue";

@WxJson({
    component: true
})
export class SwipeBox extends WxComponent<any> {

    public options = {
        addGlobalClass: true,
    };

    public relations = {
        './index': {
            type: 'child', // 关联的目标节点应为子节点
            linked(this: SwipeBox, target: SwipeRow) {
                // 每次有custom-li被插入时执行，target是该节点实例对象，触发在该节点attached生命周期之后
                target.moveCallback = this.hideRow.bind(this);
                if (!this.nodes) {
                    this.nodes = [target];
                } else {
                    this.nodes.push(target);
                }
            },
            linkChanged(target: SwipeRow) {
            },
            unlinked(this: SwipeBox, target: SwipeRow) {
                // 每次有custom-li被移除时执行，target是该节点实例对象，触发在该节点detached生命周期之后
                for (let i = 0; i < this.nodes.length; i++) {
                    if (this.nodes[i].__wxExparserNodeId__ === target.__wxExparserNodeId__) {
                        this.nodes.splice(i);
                    }
                }
            }
        }
    }

    public nodes: SwipeRow[] = [];

    ready() {

    }

    @WxMethod()
    public hideRow(row: SwipeRow) {
        let nodes: SwipeRow[] = this.nodes;//this.getRelationNodes<SwipeRow>('swiperow');
        console.log(this, nodes);
        
        if (!nodes) {
            return;
        }
        for (const item of nodes) {
            if (item.__wxExparserNodeId__ === row.__wxExparserNodeId__) {
                continue;
            }
            item.reset();
        }
    }
    
}

</script>
<style lang="scss" scoped>

</style>
