import { WorkflowDefinition, ActivityResourceConstraint } from '../types/workflow';
import { PROXYCACHE_BPMN_XML, PROXYCACHE_ACTIVITY_CONSTRAINTS } from './proxyCacheTemplate';

// Template 1: Smart City Multi-Tier Video Analytics Pipeline (Edge -> MEC -> Cloud)
export const SMART_CITY_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_SmartCity" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_SmartCityContinuum" name="Smart City Video &amp; Telemetry Pipeline" isExecutable="true">
    <bpmn:startEvent id="StartEvent_CameraTrigger" name="CCTV / Sensor Trigger">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    
    <bpmn:serviceTask id="Activity_EdgeFilter" name="Edge Video Ingestion &amp; Noise Filter">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="Activity_LocalInference" name="Local YOLO Object &amp; Motion Detection">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:exclusiveGateway id="Gateway_AnomalyCheck" name="Anomaly / Incident Detected?">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_AnomalyYes</bpmn:outgoing>
      <bpmn:outgoing>Flow_AnomalyNo</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    
    <bpmn:serviceTask id="Activity_MecCrossTracking" name="Regional MEC Cross-Camera Re-ID &amp; Tracking">
      <bpmn:incoming>Flow_AnomalyYes</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="Activity_MecLocalAlert" name="Low-Latency Traffic Signal &amp; Alert Dispatch">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="Activity_CloudGlobalAnalytics" name="Central Cloud Archival &amp; Model Fine-Tuning">
      <bpmn:incoming>Flow_5</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="Activity_EdgeCompress" name="Lightweight Periodic Telemetry Summary">
      <bpmn:incoming>Flow_AnomalyNo</bpmn:incoming>
      <bpmn:outgoing>Flow_7</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:endEvent id="EndEvent_Pipeline" name="Incident Logged &amp; Model Synced">
      <bpmn:incoming>Flow_6</bpmn:incoming>
      <bpmn:incoming>Flow_7</bpmn:incoming>
    </bpmn:endEvent>
    
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_CameraTrigger" targetRef="Activity_EdgeFilter" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Activity_EdgeFilter" targetRef="Activity_LocalInference" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Activity_LocalInference" targetRef="Gateway_AnomalyCheck" />
    <bpmn:sequenceFlow id="Flow_AnomalyYes" name="Critical / Anomaly" sourceRef="Gateway_AnomalyCheck" targetRef="Activity_MecCrossTracking" />
    <bpmn:sequenceFlow id="Flow_AnomalyNo" name="Nominal Routine" sourceRef="Gateway_AnomalyCheck" targetRef="Activity_EdgeCompress" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Activity_MecCrossTracking" targetRef="Activity_MecLocalAlert" />
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Activity_MecLocalAlert" targetRef="Activity_CloudGlobalAnalytics" />
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Activity_CloudGlobalAnalytics" targetRef="EndEvent_Pipeline" />
    <bpmn:sequenceFlow id="Flow_7" sourceRef="Activity_EdgeCompress" targetRef="EndEvent_Pipeline" />
  </bpmn:process>
  
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_SmartCityContinuum">
      <bpmndi:BPMNShape id="_BPMNShape_Start" bpmnElement="StartEvent_CameraTrigger">
        <dc:Bounds x="160" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="141" y="205" width="76" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Shape_EdgeFilter" bpmnElement="Activity_EdgeFilter">
        <dc:Bounds x="250" y="140" width="140" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Shape_LocalInference" bpmnElement="Activity_LocalInference">
        <dc:Bounds x="440" y="140" width="150" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Shape_Gateway" bpmnElement="Gateway_AnomalyCheck" isMarkerVisible="true">
        <dc:Bounds x="645" y="155" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="640" y="118" width="60" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Shape_MecCrossTracking" bpmnElement="Activity_MecCrossTracking">
        <dc:Bounds x="750" y="140" width="160" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Shape_MecLocalAlert" bpmnElement="Activity_MecLocalAlert">
        <dc:Bounds x="960" y="140" width="150" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Shape_CloudAnalytics" bpmnElement="Activity_CloudGlobalAnalytics">
        <dc:Bounds x="1160" y="140" width="160" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Shape_EdgeCompress" bpmnElement="Activity_EdgeCompress">
        <dc:Bounds x="750" y="270" width="160" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Shape_End" bpmnElement="EndEvent_Pipeline">
        <dc:Bounds x="1372" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1352" y="205" width="76" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNEdge id="Edge_1" bpmnElement="Flow_1">
        <di:waypoint x="196" y="180" />
        <di:waypoint x="250" y="180" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_2" bpmnElement="Flow_2">
        <di:waypoint x="390" y="180" />
        <di:waypoint x="440" y="180" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_3" bpmnElement="Flow_3">
        <di:waypoint x="590" y="180" />
        <di:waypoint x="645" y="180" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_Yes" bpmnElement="Flow_AnomalyYes">
        <di:waypoint x="695" y="180" />
        <di:waypoint x="750" y="180" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_No" bpmnElement="Flow_AnomalyNo">
        <di:waypoint x="670" y="205" />
        <di:waypoint x="670" y="310" />
        <di:waypoint x="750" y="310" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_4" bpmnElement="Flow_4">
        <di:waypoint x="910" y="180" />
        <di:waypoint x="960" y="180" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_5" bpmnElement="Flow_5">
        <di:waypoint x="1110" y="180" />
        <di:waypoint x="1160" y="180" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_6" bpmnElement="Flow_6">
        <di:waypoint x="1320" y="180" />
        <di:waypoint x="1372" y="180" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_7" bpmnElement="Flow_7">
        <di:waypoint x="910" y="310" />
        <di:waypoint x="1390" y="310" />
        <di:waypoint x="1390" y="198" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

// Template 2: Federated Healthcare Collaborative Diagnostic Workflow
export const HEALTHCARE_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_Healthcare" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_HealthcareContinuum" name="Hierarchical Clinical FL Pipeline" isExecutable="true">
    <bpmn:startEvent id="Start_Dicom" name="New PACS MRI/CT Scans">
      <bpmn:outgoing>HFlow_1</bpmn:outgoing>
    </bpmn:startEvent>
    
    <bpmn:serviceTask id="Activity_AnonymizeDICOM" name="On-Prem Anonymization &amp; Cohort Masking">
      <bpmn:incoming>HFlow_1</bpmn:incoming>
      <bpmn:outgoing>HFlow_2</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="Activity_LocalPyTorchTrain" name="Hospital Local Epochs &amp; Gradient Computation">
      <bpmn:incoming>HFlow_2</bpmn:incoming>
      <bpmn:outgoing>HFlow_3</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="Activity_RegionalSecAgg" name="Regional MEC Secure Aggregation &amp; DP Noise">
      <bpmn:incoming>HFlow_3</bpmn:incoming>
      <bpmn:outgoing>HFlow_4</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="Activity_CloudEnclaveFedAvg" name="Central TEE Enclave Global Weight Merge">
      <bpmn:incoming>HFlow_4</bpmn:incoming>
      <bpmn:outgoing>HFlow_5</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="Activity_AuditValidation" name="Independent Multi-Silo Benchmark Verification">
      <bpmn:incoming>HFlow_5</bpmn:incoming>
      <bpmn:outgoing>HFlow_6</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:endEvent id="End_ModelUpdate" name="Global Weights Published">
      <bpmn:incoming>HFlow_6</bpmn:incoming>
    </bpmn:endEvent>
    
    <bpmn:sequenceFlow id="HFlow_1" sourceRef="Start_Dicom" targetRef="Activity_AnonymizeDICOM" />
    <bpmn:sequenceFlow id="HFlow_2" sourceRef="Activity_AnonymizeDICOM" targetRef="Activity_LocalPyTorchTrain" />
    <bpmn:sequenceFlow id="HFlow_3" sourceRef="Activity_LocalPyTorchTrain" targetRef="Activity_RegionalSecAgg" />
    <bpmn:sequenceFlow id="HFlow_4" sourceRef="Activity_RegionalSecAgg" targetRef="Activity_CloudEnclaveFedAvg" />
    <bpmn:sequenceFlow id="HFlow_5" sourceRef="Activity_CloudEnclaveFedAvg" targetRef="Activity_AuditValidation" />
    <bpmn:sequenceFlow id="HFlow_6" sourceRef="Activity_AuditValidation" targetRef="End_ModelUpdate" />
  </bpmn:process>
  
  <bpmndi:BPMNDiagram id="BPMNDiagram_Healthcare">
    <bpmndi:BPMNPlane id="BPMNPlane_Healthcare" bpmnElement="Process_HealthcareContinuum">
      <bpmndi:BPMNShape id="H_Start" bpmnElement="Start_Dicom">
        <dc:Bounds x="160" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="139" y="205" width="80" height="27" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="H_Anon" bpmnElement="Activity_AnonymizeDICOM">
        <dc:Bounds x="250" y="140" width="160" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="H_LocalTrain" bpmnElement="Activity_LocalPyTorchTrain">
        <dc:Bounds x="460" y="140" width="170" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="H_RegSecAgg" bpmnElement="Activity_RegionalSecAgg">
        <dc:Bounds x="680" y="140" width="170" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="H_CloudEnclave" bpmnElement="Activity_CloudEnclaveFedAvg">
        <dc:Bounds x="900" y="140" width="170" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="H_Auditor" bpmnElement="Activity_AuditValidation">
        <dc:Bounds x="1120" y="140" width="170" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="H_End" bpmnElement="End_ModelUpdate">
        <dc:Bounds x="1340" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="1320" y="205" width="76" height="27" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNEdge id="HE_1" bpmnElement="HFlow_1"><di:waypoint x="196" y="180" /><di:waypoint x="250" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="HE_2" bpmnElement="HFlow_2"><di:waypoint x="410" y="180" /><di:waypoint x="460" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="HE_3" bpmnElement="HFlow_3"><di:waypoint x="630" y="180" /><di:waypoint x="680" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="HE_4" bpmnElement="HFlow_4"><di:waypoint x="850" y="180" /><di:waypoint x="900" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="HE_5" bpmnElement="HFlow_5"><di:waypoint x="1070" y="180" /><di:waypoint x="1120" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="HE_6" bpmnElement="HFlow_6"><di:waypoint x="1290" y="180" /><di:waypoint x="1340" y="180" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

// Initial Activity Constraints for Smart City
export const SMART_CITY_ACTIVITY_CONSTRAINTS: Record<string, ActivityResourceConstraint> = {
  Activity_EdgeFilter: {
    activityId: 'Activity_EdgeFilter',
    activityName: 'Edge Video Ingestion & Noise Filter',
    activityType: 'ServiceTask',
    candidateGroupIds: ['grp-hospital-clinical-data', 'grp-smart-traffic-sensors'],
    allowedResourceTypes: ['res-jetson-nano-4gb', 'res-smart-meter-sensor'],
    placementStrategy: 'edge_preferred',
    requiredComputeTFlops: 0.2,
    requiredMemoryGB: 2,
    requiredBandwidthMbps: 50,
    maxLatencyMs: 30,
    priority: 'high',
    estimatedDurationSec: 1.5,
    dataInputSizeMB: 120,
    dataOutputSizeMB: 25,
    notes: 'Runs at the camera source to drop corrupted frames and apply H.265 compression.'
  },
  Activity_LocalInference: {
    activityId: 'Activity_LocalInference',
    activityName: 'Local YOLO Object & Motion Detection',
    activityType: 'ServiceTask',
    candidateGroupIds: ['grp-hospital-clinical-data', 'grp-training-workstations-eu', 'grp-autonomous-fleet-vehicles'],
    allowedResourceTypes: ['res-jetson-agx-orin', 'res-rtx4090-workstation', 'res-hospital-pacs-scanner'],
    placementStrategy: 'edge_preferred',
    requiredComputeTFlops: 15.0,
    requiredMemoryGB: 12,
    requiredBandwidthMbps: 100,
    maxLatencyMs: 40,
    priority: 'high',
    estimatedDurationSec: 2.8,
    dataInputSizeMB: 25,
    dataOutputSizeMB: 4,
    notes: 'Runs INT8 / FP16 neural bounding box inference directly on edge accelerators.'
  },
  Activity_MecCrossTracking: {
    activityId: 'Activity_MecCrossTracking',
    activityName: 'Regional MEC Cross-Camera Re-ID & Tracking',
    activityType: 'ServiceTask',
    candidateGroupIds: ['grp-eu-regional-agg', 'grp-na-regional-agg', 'grp-downtown-mec'],
    allowedResourceTypes: ['res-poweredge-xr4000'],
    placementStrategy: 'mec_preferred',
    requiredComputeTFlops: 80.0,
    requiredMemoryGB: 32,
    requiredBandwidthMbps: 2500,
    maxLatencyMs: 20,
    priority: 'critical',
    estimatedDurationSec: 4.0,
    dataInputSizeMB: 60,
    dataOutputSizeMB: 15,
    notes: 'Runs at 5G MEC telecom node to perform multi-camera trajectory fusion.'
  },
  Activity_MecLocalAlert: {
    activityId: 'Activity_MecLocalAlert',
    activityName: 'Low-Latency Traffic Signal & Alert Dispatch',
    activityType: 'ServiceTask',
    candidateGroupIds: ['grp-eu-regional-agg', 'grp-downtown-mec'],
    allowedResourceTypes: ['res-poweredge-xr4000'],
    placementStrategy: 'lowest_latency',
    requiredComputeTFlops: 10.0,
    requiredMemoryGB: 8,
    requiredBandwidthMbps: 500,
    maxLatencyMs: 15,
    priority: 'critical',
    estimatedDurationSec: 0.8,
    dataInputSizeMB: 5,
    dataOutputSizeMB: 1,
    notes: 'Dispatches emergency override commands to traffic control hardware.'
  },
  Activity_CloudGlobalAnalytics: {
    activityId: 'Activity_CloudGlobalAnalytics',
    activityName: 'Central Cloud Archival & Model Fine-Tuning',
    activityType: 'ServiceTask',
    candidateGroupIds: ['grp-root-cloud', 'grp-central-transport-hub', 'grp-mobile-root'],
    allowedResourceTypes: ['res-h100-sxm5', 'res-a100-80gb'],
    placementStrategy: 'cloud_preferred',
    requiredComputeTFlops: 500.0,
    requiredMemoryGB: 64,
    requiredBandwidthMbps: 10000,
    maxLatencyMs: 250,
    priority: 'normal',
    estimatedDurationSec: 18.0,
    dataInputSizeMB: 250,
    dataOutputSizeMB: 50,
    notes: 'Heavyweight global foundation model retraining and historical geospatial heatmaps.'
  },
  Activity_EdgeCompress: {
    activityId: 'Activity_EdgeCompress',
    activityName: 'Lightweight Periodic Telemetry Summary',
    activityType: 'ServiceTask',
    candidateGroupIds: ['grp-hospital-clinical-data', 'grp-smart-traffic-sensors'],
    allowedResourceTypes: ['res-smart-meter-sensor', 'res-jetson-nano-4gb'],
    placementStrategy: 'energy_efficient',
    requiredComputeTFlops: 0.05,
    requiredMemoryGB: 1,
    requiredBandwidthMbps: 10,
    maxLatencyMs: 500,
    priority: 'low',
    estimatedDurationSec: 1.0,
    dataInputSizeMB: 10,
    dataOutputSizeMB: 0.5,
    notes: 'Summarizes heartbeat and ambient sensor readings without heavy video payloads.'
  }
};

// Initial Activity Constraints for Healthcare
export const HEALTHCARE_ACTIVITY_CONSTRAINTS: Record<string, ActivityResourceConstraint> = {
  Activity_AnonymizeDICOM: {
    activityId: 'Activity_AnonymizeDICOM',
    activityName: 'On-Prem Anonymization & Cohort Masking',
    activityType: 'ServiceTask',
    candidateGroupIds: ['grp-hospital-clinical-data'],
    allowedResourceTypes: ['res-hospital-pacs-scanner', 'res-apple-m3-max'],
    placementStrategy: 'edge_preferred',
    requiredComputeTFlops: 12.0,
    requiredMemoryGB: 16,
    requiredBandwidthMbps: 500,
    maxLatencyMs: 50,
    priority: 'high',
    estimatedDurationSec: 3.2,
    dataInputSizeMB: 400,
    dataOutputSizeMB: 120,
    notes: 'Strict HIPAA de-identification performed inside the hospital network boundary.'
  },
  Activity_LocalPyTorchTrain: {
    activityId: 'Activity_LocalPyTorchTrain',
    activityName: 'Hospital Local Epochs & Gradient Computation',
    activityType: 'ServiceTask',
    candidateGroupIds: ['grp-training-workstations-eu', 'grp-na-training-cluster'],
    allowedResourceTypes: ['res-rtx4090-workstation'],
    placementStrategy: 'highest_compute',
    requiredComputeTFlops: 75.0,
    requiredMemoryGB: 24,
    requiredBandwidthMbps: 1000,
    maxLatencyMs: 100,
    priority: 'critical',
    estimatedDurationSec: 12.5,
    dataInputSizeMB: 120,
    dataOutputSizeMB: 45,
    notes: 'Runs ResNet-50 local gradient backpropagation on RTX 4090 clusters.'
  },
  Activity_RegionalSecAgg: {
    activityId: 'Activity_RegionalSecAgg',
    activityName: 'Regional MEC Secure Aggregation & DP Noise',
    activityType: 'ServiceTask',
    candidateGroupIds: ['grp-eu-regional-agg', 'grp-na-regional-agg'],
    allowedResourceTypes: ['res-poweredge-xr4000'],
    placementStrategy: 'mec_preferred',
    requiredComputeTFlops: 60.0,
    requiredMemoryGB: 32,
    requiredBandwidthMbps: 5000,
    maxLatencyMs: 35,
    priority: 'high',
    estimatedDurationSec: 4.5,
    dataInputSizeMB: 90,
    dataOutputSizeMB: 45,
    notes: 'Regional reduction aggregating European hospital updates via SecAgg secret sharing.'
  },
  Activity_CloudEnclaveFedAvg: {
    activityId: 'Activity_CloudEnclaveFedAvg',
    activityName: 'Central TEE Enclave Global Weight Merge',
    activityType: 'ServiceTask',
    candidateGroupIds: ['grp-root-cloud'],
    allowedResourceTypes: ['res-h100-sxm5'],
    placementStrategy: 'cloud_preferred',
    requiredComputeTFlops: 400.0,
    requiredMemoryGB: 64,
    requiredBandwidthMbps: 20000,
    maxLatencyMs: 150,
    priority: 'critical',
    estimatedDurationSec: 6.0,
    dataInputSizeMB: 90,
    dataOutputSizeMB: 45,
    notes: 'Global model merge running inside AMD SEV / Intel SGX confidential VM.'
  },
  Activity_AuditValidation: {
    activityId: 'Activity_AuditValidation',
    activityName: 'Independent Multi-Silo Benchmark Verification',
    activityType: 'ServiceTask',
    candidateGroupIds: ['grp-independent-auditors'],
    allowedResourceTypes: ['res-a100-80gb'],
    placementStrategy: 'highest_compute',
    requiredComputeTFlops: 120.0,
    requiredMemoryGB: 40,
    requiredBandwidthMbps: 10000,
    maxLatencyMs: 100,
    priority: 'high',
    estimatedDurationSec: 5.0,
    dataInputSizeMB: 45,
    dataOutputSizeMB: 5,
    notes: 'Runs test evaluation on independent holdout clinical cohort to detect model drift.'
  }
};

export const DEFAULT_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'wf-proxycache',
    name: 'ProxyCache Continuum Workflow (Proxy & Origin)',
    description: 'Cloud-edge continuum cache architecture evaluating proxy lookup, hit serving, origin fetch, and store with branch probabilities (80% hit / 20% miss).',
    bpmnXml: PROXYCACHE_BPMN_XML,
    processRef: 'proxycache',
    activityConstraints: PROXYCACHE_ACTIVITY_CONSTRAINTS,
    branchingProbabilities: [
      { gatewayId: 'Gateway_Hit', flowId: 'Flow_Hit', branchingProbability: 0.8 },
      { gatewayId: 'Gateway_Hit', flowId: 'Flow_Miss', branchingProbability: 0.2 }
    ]
  },
  {
    id: 'wf-smart-city',
    name: 'Smart City Video & Telemetry Pipeline',
    description: 'Cloud-Edge continuum workflow from edge camera triggers, through regional MEC trajectory analysis, to central cloud model retraining.',
    bpmnXml: SMART_CITY_BPMN_XML,
    processRef: 'Process_SmartCityContinuum',
    activityConstraints: SMART_CITY_ACTIVITY_CONSTRAINTS,
    branchingProbabilities: [
      { gatewayId: 'Gateway_AnomalyCheck', flowId: 'Flow_AnomalyYes', branchingProbability: 0.15 },
      { gatewayId: 'Gateway_AnomalyCheck', flowId: 'Flow_AnomalyNo', branchingProbability: 0.85 }
    ]
  },
  {
    id: 'wf-healthcare',
    name: 'Hierarchical Clinical Federated Learning Pipeline',
    description: 'Continuum workflow executing DICOM anonymization on hospital edge, GPU training in local silos, regional MEC aggregation, and cloud enclave validation.',
    bpmnXml: HEALTHCARE_BPMN_XML,
    processRef: 'Process_HealthcareContinuum',
    activityConstraints: HEALTHCARE_ACTIVITY_CONSTRAINTS
  }
];
