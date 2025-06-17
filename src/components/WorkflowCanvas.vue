<script setup>
import { VueFlow, useVueFlow, MarkerType } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import axios from 'axios'

const { onPaneReady, addNodes, addEdges, onNodeClick } = useVueFlow()

onPaneReady(async ({ fitView }) => {
  try {
    const response = await axios.get('https://w2yeklcbqa.execute-api.us-west-1.amazonaws.com/context/workflows')
    const workflows = response.data.workflows

    const nodes = workflows.map((wf, index) => ({
      id: `${index + 1}`,
      label: wf,
      position: { x: 100 + index * 200, y: 100 },
      style: { backgroundColor: '#4CAF50', color: 'white', padding: '8px' },
      data: { workflow: wf }
    }))

    addNodes(nodes)

    const edges = nodes.slice(0, -1).map((node, i) => ({
      id: `e${node.id}-${nodes[i + 1].id}`,
      source: node.id,
      target: nodes[i + 1].id,
      label: 'Next',
      markerEnd: MarkerType.ArrowClosed
    }))

    addEdges(edges)
    fitView()
  } catch (error) {
    alert(`❌ Failed to fetch workflows: ${error}`)
  }
})

onNodeClick(async (event) => {
  const node = event.node
  const workflowName = node.data?.workflow
  if (!workflowName) return

  try {
    await axios.post(`https://w2yeklcbqa.execute-api.us-west-1.amazonaws.com/context/trigger/${workflowName}`, { params: { example: 'test' } })
    alert(`✅ Workflow '${workflowName}' triggered!`)
  } catch (err) {
    alert(`❌ Failed to trigger workflow: ${err}`)
  }
})
</script>

<template>
  <VueFlow class="w-full h-full" />
</template>

<style scoped>
.vue-flow {
  width: 100%;
  height: 100%;
}
</style>

