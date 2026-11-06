import { WorkflowDefinition, ActivityResourceConstraint } from '../types/workflow';

// ProxyCache BPMN 2.0 XML Diagram
export const PROXYCACHE_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_ProxyCache" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="proxycache" name="Proxy Cache Process" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Client Request Arrival">
      <bpmn:outgoing>Flow_ToLookup</bpmn:outgoing>
    </bpmn:startEvent>
    
    <bpmn:serviceTask id="Proxy_Lookup" name="Proxy lookup">
      <bpmn:incoming>Flow_ToLookup</bpmn:incoming>
      <bpmn:outgoing>Flow_ToGateway</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:exclusiveGateway id="Gateway_Hit" name="Cache Hit?">
      <bpmn:incoming>Flow_ToGateway</bpmn:incoming>
      <bpmn:outgoing>Flow_Hit</bpmn:outgoing>
      <bpmn:outgoing>Flow_Miss</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    
    <bpmn:serviceTask id="Proxy_Serve_Hit" name="Proxy serve hit">
      <bpmn:incoming>Flow_Hit</bpmn:incoming>
      <bpmn:outgoing>Flow_HitToEnd</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="Origin_Fetch" name="Origin fetch">
      <bpmn:incoming>Flow_Miss</bpmn:incoming>
      <bpmn:outgoing>Flow_ToStore</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="Proxy_Store" name="Proxy store">
      <bpmn:incoming>Flow_ToStore</bpmn:incoming>
      <bpmn:outgoing>Flow_StoreToEnd</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:endEvent id="EndEvent_1" name="Response Delivered">
      <bpmn:incoming>Flow_HitToEnd</bpmn:incoming>
      <bpmn:incoming>Flow_StoreToEnd</bpmn:incoming>
    </bpmn:endEvent>
    
    <bpmn:sequenceFlow id="Flow_ToLookup" sourceRef="StartEvent_1" targetRef="Proxy_Lookup" />
    <bpmn:sequenceFlow id="Flow_ToGateway" sourceRef="Proxy_Lookup" targetRef="Gateway_Hit" />
    <bpmn:sequenceFlow id="Flow_Hit" name="Hit (80%)" sourceRef="Gateway_Hit" targetRef="Proxy_Serve_Hit" />
    <bpmn:sequenceFlow id="Flow_Miss" name="Miss (20%)" sourceRef="Gateway_Hit" targetRef="Origin_Fetch" />
    <bpmn:sequenceFlow id="Flow_ToStore" sourceRef="Origin_Fetch" targetRef="Proxy_Store" />
    <bpmn:sequenceFlow id="Flow_HitToEnd" sourceRef="Proxy_Serve_Hit" targetRef="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_StoreToEnd" sourceRef="Proxy_Store" targetRef="EndEvent_1" />
  </bpmn:process>
  
  <bpmndi:BPMNDiagram id="BPMNDiagram_ProxyCache">
    <bpmndi:BPMNPlane id="BPMNPlane_ProxyCache" bpmnElement="proxycache">
      <bpmndi:BPMNShape id="Shape_Start" bpmnElement="StartEvent_1">
        <dc:Bounds x="160" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="142" y="205" width="73" height="27" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Shape_Lookup" bpmnElement="Proxy_Lookup">
        <dc:Bounds x="250" y="140" width="130" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Shape_Gateway" bpmnElement="Gateway_Hit" isMarkerVisible="true">
        <dc:Bounds x="440" y="155" width="50" height="50" />
        <bpmndi:BPMNLabel><dc:Bounds x="438" y="125" width="55" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Shape_ServeHit" bpmnElement="Proxy_Serve_Hit">
        <dc:Bounds x="550" y="80" width="130" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Shape_OriginFetch" bpmnElement="Origin_Fetch">
        <dc:Bounds x="550" y="220" width="130" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Shape_ProxyStore" bpmnElement="Proxy_Store">
        <dc:Bounds x="730" y="220" width="130" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Shape_End" bpmnElement="EndEvent_1">
        <dc:Bounds x="920" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="912" y="205" width="53" height="27" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNEdge id="Edge_ToLookup" bpmnElement="Flow_ToLookup">
        <di:waypoint x="196" y="180" /><di:waypoint x="250" y="180" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_ToGateway" bpmnElement="Flow_ToGateway">
        <di:waypoint x="380" y="180" /><di:waypoint x="440" y="180" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_Hit" bpmnElement="Flow_Hit">
        <di:waypoint x="465" y="155" /><di:waypoint x="465" y="120" /><di:waypoint x="550" y="120" />
        <bpmndi:BPMNLabel><dc:Bounds x="475" y="103" width="45" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_Miss" bpmnElement="Flow_Miss">
        <di:waypoint x="465" y="205" /><di:waypoint x="465" y="260" /><di:waypoint x="550" y="260" />
        <bpmndi:BPMNLabel><dc:Bounds x="471" y="243" width="53" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_ToStore" bpmnElement="Flow_ToStore">
        <di:waypoint x="680" y="260" /><di:waypoint x="730" y="260" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_HitToEnd" bpmnElement="Flow_HitToEnd">
        <di:waypoint x="680" y="120" /><di:waypoint x="938" y="120" /><di:waypoint x="938" y="162" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_StoreToEnd" bpmnElement="Flow_StoreToEnd">
        <di:waypoint x="860" y="260" /><di:waypoint x="938" y="260" /><di:waypoint x="938" y="198" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

export const PROXYCACHE_ACTIVITY_CONSTRAINTS: Record<string, ActivityResourceConstraint> = {
  Proxy_Lookup: {
    activityId: 'Proxy_Lookup',
    activityName: 'Proxy lookup',
    activityType: 'ServiceTask',
    candidateGroupIds: ['grp-eu-regional-agg', 'grp-hospital-clinical-data'],
    allowedResourceTypes: ['res-proxy', 'res-poweredge-xr4000'],
    placementStrategy: 'edge_preferred',
    requiredComputeTFlops: 1.0,
    requiredMemoryGB: 4,
    requiredBandwidthMbps: 100,
    maxLatencyMs: 10,
    priority: 'high',
    estimatedDurationSec: 0.2,
    dataInputSizeMB: 1,
    dataOutputSizeMB: 1,
    bsimResources: [{ resourceId: 'proxy', amount: 1 }],
    bsimAttributes: [{ key: 'numInstructions', value: 2000 }],
    notes: 'Fast in-memory cache index check for HTTP entity tag'
  },
  Proxy_Serve_Hit: {
    activityId: 'Proxy_Serve_Hit',
    activityName: 'Proxy serve hit',
    activityType: 'ServiceTask',
    candidateGroupIds: ['grp-eu-regional-agg', 'grp-hospital-clinical-data'],
    allowedResourceTypes: ['res-proxy'],
    placementStrategy: 'edge_preferred',
    requiredComputeTFlops: 1.0,
    requiredMemoryGB: 4,
    requiredBandwidthMbps: 200,
    maxLatencyMs: 15,
    priority: 'normal',
    estimatedDurationSec: 0.2,
    dataInputSizeMB: 1,
    dataOutputSizeMB: 15,
    bsimResources: [{ resourceId: 'proxy', amount: 1 }],
    bsimAttributes: [{ key: 'numInstructions', value: 2000 }],
    notes: 'Transmits cached response body immediately from local edge store'
  },
  Origin_Fetch: {
    activityId: 'Origin_Fetch',
    activityName: 'Origin fetch',
    activityType: 'ServiceTask',
    candidateGroupIds: ['grp-root-cloud'],
    allowedResourceTypes: ['res-origin', 'res-h100-sxm5'],
    placementStrategy: 'cloud_preferred',
    requiredComputeTFlops: 5.0,
    requiredMemoryGB: 16,
    requiredBandwidthMbps: 1000,
    maxLatencyMs: 200,
    priority: 'high',
    estimatedDurationSec: 2.0,
    dataInputSizeMB: 1,
    dataOutputSizeMB: 15,
    bsimResources: [{ resourceId: 'origin', amount: 1 }],
    bsimAttributes: [{ key: 'readOps', value: 200 }],
    notes: 'Cache miss fallback fetching raw objects from origin data warehouse'
  },
  Proxy_Store: {
    activityId: 'Proxy_Store',
    activityName: 'Proxy store',
    activityType: 'ServiceTask',
    candidateGroupIds: ['grp-eu-regional-agg', 'grp-hospital-clinical-data'],
    allowedResourceTypes: ['res-proxy'],
    placementStrategy: 'edge_preferred',
    requiredComputeTFlops: 1.0,
    requiredMemoryGB: 4,
    requiredBandwidthMbps: 200,
    maxLatencyMs: 20,
    priority: 'normal',
    estimatedDurationSec: 0.2,
    dataInputSizeMB: 15,
    dataOutputSizeMB: 15,
    bsimResources: [{ resourceId: 'proxy', amount: 1 }],
    bsimAttributes: [{ key: 'numInstructions', value: 2000 }],
    notes: 'Persists fetched entity into edge LRU storage'
  }
};
