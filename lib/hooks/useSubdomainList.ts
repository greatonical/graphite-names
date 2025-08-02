// lib/hooks/useSubdomainList.ts
"use client";

import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbi, getContract } from 'viem';

interface Subdomain {
  name: string;
  fullName: string;
  expiry: Date;
  daysLeft: number;
  node: string;
}

const REGISTRY_ABI = parseAbi([
  'function getDomain(bytes32 node) view returns (address owner, address resolver, uint64 expiry, bytes32 parent)',
  'event DomainRegistered(bytes32 indexed node, string label, address owner, uint64 expiry)',
]);

const SUBDOMAIN_ABI = parseAbi([
  'event SubdomainRegistered(bytes32 indexed node, string label, address owner, uint64 expiry)',
]);

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;
const SUBDOMAIN_ADDRESS = process.env.NEXT_PUBLIC_SUBDOMAIN_ADDRESS as `0x${string}`;

export function useSubdomainList(parentNode: string) {
  const publicClient = usePublicClient();
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSubdomains, setHasSubdomains] = useState(false);

  const calculateDaysLeft = (expiry: Date): number => {
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const fetchSubdomains = async () => {
    if (!publicClient || !parentNode) {
      setSubdomains([]);
      setHasSubdomains(false);
      return;
    }

    setLoading(true);

    try {
      // Get all SubdomainRegistered events
      const fromBlock = BigInt(0); // You might want to store this for efficiency
      const toBlock = 'latest';

      // Fetch subdomain registration events
      const subdomainLogs = await publicClient.getLogs({
        address: SUBDOMAIN_ADDRESS,
        event: {
          type: 'event',
          name: 'SubdomainRegistered',
          inputs: [
            { name: 'node', type: 'bytes32', indexed: true },
            { name: 'label', type: 'string', indexed: false },
            { name: 'owner', type: 'address', indexed: false },
            { name: 'expiry', type: 'uint64', indexed: false },
          ],
        },
        fromBlock,
        toBlock,
      });

      // Also check regular domain registration events that might be subdomains
      const domainLogs = await publicClient.getLogs({
        address: REGISTRY_ADDRESS,
        event: {
          type: 'event',
          name: 'DomainRegistered',
          inputs: [
            { name: 'node', type: 'bytes32', indexed: true },
            { name: 'label', type: 'string', indexed: false },
            { name: 'owner', type: 'address', indexed: false },
            { name: 'expiry', type: 'uint64', indexed: false },
          ],
        },
        fromBlock,
        toBlock,
      });

      const foundSubdomains: Subdomain[] = [];
      const contract = getContract({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        client: publicClient,
      });

      // Process subdomain registrar events
      for (const log of subdomainLogs) {
        if (!log.args?.node || !log.args.label || !log.args.expiry) continue;

        try {
          // Check if this subdomain belongs to our parent domain
          const domainInfo = await contract.read.getDomain([log.args.node]);
          const domainParent = domainInfo[3]; // parent field

          if (domainParent.toLowerCase() === parentNode.toLowerCase()) {
            const expiry = new Date(Number(log.args.expiry) * 1000);
            const daysLeft = calculateDaysLeft(expiry);

            // Get parent domain name to construct full subdomain name
            const parentDomainInfo = await contract.read.getDomain([parentNode as `0x${string}`]);
            // You'll need to map the parent node to its label - this is a simplified approach
            const parentLabel = 'atgraphite'; // This should be dynamically determined

            foundSubdomains.push({
              name: log.args.label,
              fullName: `${log.args.label}.${parentLabel}`,
              expiry,
              daysLeft,
              node: log.args.node,
            });
          }
        } catch (err) {
          console.error(`Error checking subdomain ${log.args.label}:`, err);
        }
      }

      // Process regular domain events to find subdomains
      for (const log of domainLogs) {
        if (!log.args?.node || !log.args.label || !log.args.expiry) continue;

        try {
          // Check if this domain is a subdomain of our parent
          const domainInfo = await contract.read.getDomain([log.args.node]);
          const domainParent = domainInfo[3]; // parent field

          if (domainParent.toLowerCase() === parentNode.toLowerCase()) {
            const expiry = new Date(Number(log.args.expiry) * 1000);
            const daysLeft = calculateDaysLeft(expiry);

            // Check if we already have this subdomain from subdomain registrar
            const exists = foundSubdomains.some(sub => sub.node === log.args.node);
            if (!exists) {
              // Get parent domain name
              const parentDomainInfo = await contract.read.getDomain([parentNode as `0x${string}`]);
              const parentLabel = 'atgraphite'; // This should be dynamically determined

              foundSubdomains.push({
                name: log.args.label,
                fullName: `${log.args.label}.${parentLabel}`,
                expiry,
                daysLeft,
                node: log.args.node,
              });
            }
          }
        } catch (err) {
          console.error(`Error checking domain ${log.args.label}:`, err);
        }
      }

      // Sort by expiry date (earliest first)
      foundSubdomains.sort((a, b) => a.expiry.getTime() - b.expiry.getTime());

      setSubdomains(foundSubdomains);
      setHasSubdomains(foundSubdomains.length > 0);
    } catch (err) {
      console.error('Error fetching subdomains:', err);
      setSubdomains([]);
      setHasSubdomains(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubdomains();
  }, [parentNode, publicClient]);

  return {
    subdomains,
    loading,
    hasSubdomains,
    refreshSubdomains: fetchSubdomains,
  };
}