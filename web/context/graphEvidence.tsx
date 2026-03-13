/**
 * Graph Evidence Store - додає вузли з результатів OSINT (Maigret тощо) на граф.
 */
import React, { createContext, useContext, useCallback, useState } from 'react';

export interface GraphNode {
  id: string;
  label: string;
  type: 'person' | 'web' | 'email' | 'phone' | 'server' | 'crypto';
  val?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

interface GraphEvidenceContextType {
  nodes: GraphNode[];
  edges: GraphEdge[];
  targetId: string | null;
  addEvidenceFromMaigret: (targetUsername: string, sites: Array<{ site: string; url: string }>) => void;
  clearEvidence: () => void;
}

const GraphEvidenceContext = createContext<GraphEvidenceContextType | null>(null);

export function GraphEvidenceProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [targetId, setTargetId] = useState<string | null>(null);

  const addEvidenceFromMaigret = useCallback((targetUsername: string, sites: Array<{ site: string; url: string }>) => {
    const targetNodeId = 'Target';
    const newNodes: GraphNode[] = [{ id: targetNodeId, label: targetUsername, type: 'person', val: 20 }];
    const newEdges: GraphEdge[] = [];
    const seen = new Set<string>([targetNodeId]);

    sites.forEach((s, i) => {
      if (!s.url) return;
      const nodeId = `social_${i}_${s.site.replace(/\W/g, '_')}`;
      if (seen.has(nodeId)) return;
      seen.add(nodeId);
      newNodes.push({
        id: nodeId,
        label: `${s.site}: ${s.url}`,
        type: 'web',
        val: 10,
      });
      newEdges.push({ source: targetNodeId, target: nodeId });
    });

    setTargetId(targetUsername);
    setNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]));
      newNodes.forEach((n) => byId.set(n.id, n));
      return Array.from(byId.values());
    });
    setEdges((prev) => {
      const key = (a: string, b: string) => `${a}->${b}`;
      const seen = new Set(prev.map((e) => key(e.source, e.target)));
      const added = newEdges.filter((e) => !seen.has(key(e.source, e.target)));
      return [...prev, ...added];
    });
  }, []);

  const clearEvidence = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setTargetId(null);
  }, []);

  return (
    <GraphEvidenceContext.Provider value={{ nodes, edges, targetId, addEvidenceFromMaigret, clearEvidence }}>
      {children}
    </GraphEvidenceContext.Provider>
  );
}

export function useGraphEvidence() {
  const ctx = useContext(GraphEvidenceContext);
  if (!ctx) throw new Error('useGraphEvidence must be used within GraphEvidenceProvider');
  return ctx;
}
