import { ResourceType, SimulationGroup, SimulationGlobalConfig } from '../types/simulation';
import { WorkflowDefinition, ActivityResourceConstraint } from '../types/workflow';

/**
 * Generates the [filename].global.xml content containing the available resource list
 * conforming to:
 * <bsim:globalConfiguration xmlns:bsim="http://bsim.hpi.uni-potsdam.de/scylla/simModel"
 *                           targetNamespace="http://www.hpi.de"
 *                           id="[id]-global"
 *                           softmaxExponent="1">
 *   <bsim:resourceData>
 *     <bsim:dynamicResource id="proxy" defaultQuantity="1" defaultCost="1" defaultTimeUnit="SECONDS" cpuSpeed="1000" />
 *     ...
 *   </bsim:resourceData>
 *   <bsim:randomSeed>42</bsim:randomSeed>
 * </bsim:globalConfiguration>
 */
export function generateBsimGlobalXml(
  groups: SimulationGroup[],
  catalog: ResourceType[],
  config: SimulationGlobalConfig,
  filenamePrefix: string = 'simulation'
): string {
  const simId = config.bsimId || filenamePrefix.replace(/[^a-zA-Z0-9_-]/g, '-');
  const softmaxExp = config.bsimSoftmaxExponent ?? 1;
  const randomSeed = config.bsimRandomSeed ?? 42;

  // Collect all unique resource types used across groups (or in the catalog)
  // We can either export active group allocations or full active resources
  const dynamicResources: {
    id: string;
    defaultQuantity: number;
    defaultCost: number;
    defaultTimeUnit: string;
    cpuSpeed?: number;
    ioRead?: number;
    ioWrite?: number;
    txSpeed?: number;
    rxSpeed?: number;
  }[] = [];

  const seenIds = new Set<string>();

  // Extract from groups
  groups.forEach(group => {
    group.resourceAllocations.forEach(alloc => {
      const res = catalog.find(r => r.id === alloc.resourceTypeId);
      if (res && !seenIds.has(res.id)) {
        seenIds.add(res.id);

        // Derive speeds from computePowerTFlops, memory, bandwidth if not explicitly set
        // E.g. 1 TFlop = 10,000 instructions/s or direct cpuSpeed
        const cpuSpeed = res.cpuSpeed ?? Math.round(Math.max(100, res.computePowerTFlops * 100));
        const ioRead = res.ioRead ?? (res.category === 'cloud_datacenter' || res.category === 'edge_server' ? 200 : 10);
        const txSpeed = res.txSpeed ?? Math.round(Math.max(1, res.bandwidthMbps / 8));
        const rxSpeed = res.rxSpeed ?? Math.round(Math.max(1, res.bandwidthMbps / 8));

        // Sanitize resource ID to match standard XML ID convention (e.g., 'proxy', 'origin', 'edge_server')
        const sanitizedId = res.id.replace(/^res-/, '').replace(/-/g, '_');

        dynamicResources.push({
          id: sanitizedId,
          defaultQuantity: alloc.instances || res.defaultQuantity || 1,
          defaultCost: res.defaultCost ?? 1,
          defaultTimeUnit: res.defaultTimeUnit || 'SECONDS',
          cpuSpeed,
          ioRead,
          txSpeed,
          rxSpeed
        });
      }
    });
  });

  // If no resources in groups, provide catalog items
  if (dynamicResources.length === 0) {
    catalog.forEach(res => {
      const sanitizedId = res.id.replace(/^res-/, '').replace(/-/g, '_');
      dynamicResources.push({
        id: sanitizedId,
        defaultQuantity: res.defaultQuantity ?? 1,
        defaultCost: res.defaultCost ?? 1,
        defaultTimeUnit: res.defaultTimeUnit ?? 'SECONDS',
        cpuSpeed: res.cpuSpeed ?? Math.round(res.computePowerTFlops * 100),
        ioRead: res.ioRead ?? 50
      });
    });
  }

  // Build XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<!-- cpuSpeed: instructions/s, ioRead/ioWrite: operations/s, txSpeed/rxSpeed: MB/s (abstract units) -->\n`;
  xml += `<bsim:globalConfiguration xmlns:bsim="http://bsim.hpi.uni-potsdam.de/scylla/simModel" targetNamespace="http://www.hpi.de" id="${simId}-global" softmaxExponent="${softmaxExp}">\n`;
  xml += `  <bsim:resourceData>\n`;

  dynamicResources.forEach(res => {
    let attrStr = `id="${res.id}" defaultQuantity="${res.defaultQuantity}" defaultCost="${res.defaultCost}" defaultTimeUnit="${res.defaultTimeUnit}"`;
    if (res.cpuSpeed !== undefined) attrStr += ` cpuSpeed="${res.cpuSpeed}"`;
    if (res.ioRead !== undefined && res.ioRead > 0) attrStr += ` ioRead="${res.ioRead}"`;
    if (res.ioWrite !== undefined && res.ioWrite > 0) attrStr += ` ioWrite="${res.ioWrite}"`;
    if (res.txSpeed !== undefined && res.txSpeed > 0) attrStr += ` txSpeed="${res.txSpeed}"`;
    if (res.rxSpeed !== undefined && res.rxSpeed > 0) attrStr += ` rxSpeed="${res.rxSpeed}"`;

    xml += `    <bsim:dynamicResource ${attrStr} />\n`;
  });

  xml += `  </bsim:resourceData>\n`;
  xml += `  <bsim:randomSeed>${randomSeed}</bsim:randomSeed>\n`;
  xml += `</bsim:globalConfiguration>\n`;

  return xml;
}

/**
 * Generates the [filename].config.xml content containing the activity-to-resource_type match
 * conforming to:
 * <bsim:definitions xmlns:bsim="http://bsim.hpi.uni-potsdam.de/scylla/simModel"
 *                   id="[id]-config-definitions"
 *                   targetNamespace="http://www.hpi.de">
 *   <bsim:simulationConfiguration id="[id]-config" processRef="[processRef]"
 *                                 processInstances="2000"
 *                                 startDateTime="2025-01-01T00:00:00.000+00:00"
 *                                 randomSeed="42">
 *     <bsim:startEvent id="StartEvent_1">
 *       <bsim:arrivalRate timeUnit="SECONDS">
 *         <bsim:exponentialDistribution>
 *           <bsim:mean>50</bsim:mean>
 *         </bsim:exponentialDistribution>
 *       </bsim:arrivalRate>
 *     </bsim:startEvent>
 *     <bsim:task id="Proxy_Lookup" name="Proxy lookup">
 *       <bsim:resources>
 *         <bsim:resource id="proxy" amount="1" />
 *       </bsim:resources>
 *       <bsim:attribute key="numInstructions" value="2000" />
 *     </bsim:task>
 *     ...
 *   </bsim:simulationConfiguration>
 * </bsim:definitions>
 */
export function generateBsimConfigXml(
  workflow: WorkflowDefinition,
  groups: SimulationGroup[],
  catalog: ResourceType[],
  config: SimulationGlobalConfig,
  filenamePrefix: string = 'simulation'
): string {
  const baseId = config.bsimId || filenamePrefix.replace(/[^a-zA-Z0-9_-]/g, '-');
  const processRef = workflow.processRef || workflow.id.replace(/^wf-/, '').replace(/-/g, '_');
  const instances = config.bsimProcessInstances ?? 2000;
  const startDateTime = config.bsimStartDateTime || '2025-01-01T00:00:00.000+00:00';
  const randomSeed = config.bsimRandomSeed ?? 42;
  const arrivalMean = config.bsimArrivalRateMean ?? 50;
  const timeUnit = config.bsimArrivalRateTimeUnit ?? 'SECONDS';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<!-- Time model: 1 simulated second stands for 100 ms of real time. Speeds and demands are abstract units. -->\n`;
  xml += `<bsim:definitions xmlns:bsim="http://bsim.hpi.uni-potsdam.de/scylla/simModel" id="${baseId}-config-definitions" targetNamespace="http://www.hpi.de">\n`;
  xml += `  <bsim:simulationConfiguration id="${baseId}-config" processRef="${processRef}" processInstances="${instances}" startDateTime="${startDateTime}" randomSeed="${randomSeed}">\n`;

  // Start Event arrival rate
  xml += `    <bsim:startEvent id="StartEvent_1">\n`;
  xml += `      <bsim:arrivalRate timeUnit="${timeUnit}">\n`;
  xml += `        <bsim:exponentialDistribution>\n`;
  xml += `          <bsim:mean>${arrivalMean}</bsim:mean>\n`;
  xml += `        </bsim:exponentialDistribution>\n`;
  xml += `      </bsim:arrivalRate>\n`;
  xml += `    </bsim:startEvent>\n`;

  // Tasks & activities match
  const activities = Object.values(workflow.activityConstraints);

  activities.forEach(activity => {
    // Determine assigned or candidate resource ID
    // 1. If explicit bsimResources are set on activity, use them
    let assignedResourceIds: { id: string; amount: number }[] = [];

    if (activity.bsimResources && activity.bsimResources.length > 0) {
      assignedResourceIds = activity.bsimResources.map(r => ({ id: r.resourceId, amount: r.amount }));
    } else {
      // Resolve from candidate groups and allowed resource types
      const matchedGroups = groups.filter(g => activity.candidateGroupIds.includes(g.id));
      if (matchedGroups.length > 0) {
        matchedGroups.forEach(g => {
          g.resourceAllocations.forEach(alloc => {
            const res = catalog.find(r => r.id === alloc.resourceTypeId);
            if (res) {
              const resXmlId = res.id.replace(/^res-/, '').replace(/-/g, '_');
              if (!assignedResourceIds.some(r => r.id === resXmlId)) {
                assignedResourceIds.push({ id: resXmlId, amount: 1 });
              }
            }
          });
        });
      }

      // If still empty, check allowedResourceTypes
      if (assignedResourceIds.length === 0 && activity.allowedResourceTypes?.length > 0) {
        activity.allowedResourceTypes.forEach(resId => {
          const resXmlId = resId.replace(/^res-/, '').replace(/-/g, '_');
          if (!assignedResourceIds.some(r => r.id === resXmlId)) {
            assignedResourceIds.push({ id: resXmlId, amount: 1 });
          }
        });
      }

      // Fallback default
      if (assignedResourceIds.length === 0) {
        assignedResourceIds.push({ id: 'proxy', amount: 1 });
      }
    }

    // Attributes (numInstructions, readOps, writeOps, etc.)
    let attributes = activity.bsimAttributes || [];
    if (attributes.length === 0) {
      if (activity.activityName.toLowerCase().includes('fetch') || activity.activityName.toLowerCase().includes('data') || activity.activityName.toLowerCase().includes('dicom')) {
        attributes = [{ key: 'readOps', value: Math.max(10, Math.round(activity.dataInputSizeMB * 10)) }];
      } else {
        attributes = [{ key: 'numInstructions', value: Math.max(500, Math.round(activity.requiredComputeTFlops * 1000) || 2000) }];
      }
    }

    xml += `    <bsim:task id="${activity.activityId}" name="${escapeXml(activity.activityName)}">\n`;
    xml += `      <bsim:resources>\n`;
    assignedResourceIds.forEach(res => {
      xml += `        <bsim:resource id="${res.id}" amount="${res.amount || 1}" />\n`;
    });
    xml += `      </bsim:resources>\n`;

    attributes.forEach(attr => {
      xml += `      <bsim:attribute key="${attr.key}" value="${attr.value}" />\n`;
    });

    xml += `    </bsim:task>\n`;
  });

  // Branching probabilities if workflow contains gateways
  if (workflow.branchingProbabilities && workflow.branchingProbabilities.length > 0) {
    const gatewayMap: Record<string, typeof workflow.branchingProbabilities> = {};
    workflow.branchingProbabilities.forEach(b => {
      if (!gatewayMap[b.gatewayId]) gatewayMap[b.gatewayId] = [];
      gatewayMap[b.gatewayId].push(b);
    });

    Object.entries(gatewayMap).forEach(([gwId, branches]) => {
      xml += `    <bsim:exclusiveGateway id="${gwId}">\n`;
      branches.forEach(b => {
        xml += `      <bsim:outgoingSequenceFlow id="${b.flowId}"><bsim:branchingProbability>${b.branchingProbability}</bsim:branchingProbability></bsim:outgoingSequenceFlow>\n`;
      });
      xml += `    </bsim:exclusiveGateway>\n`;
    });
  }

  xml += `  </bsim:simulationConfiguration>\n`;
  xml += `</bsim:definitions>\n`;

  return xml;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
