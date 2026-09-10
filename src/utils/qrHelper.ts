/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Visitor } from '../types';

/**
 * Returns the base public URL for generating shareable badge links.
 */
export function getPublicAppUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin + window.location.pathname;
  }
  return '';
}

/**
 * Generates an intelligent URL that directly links to the visitor's verification card.
 * Encodes key data parameters so the card can be rendered even across different devices/browsers.
 */
export function generateVisitorBadgeUrl(visitor: Visitor): string {
  const baseUrl = getPublicAppUrl();
  const url = new URL(baseUrl);
  const code = visitor.credentialCode || visitor.id;

  url.searchParams.set('badge', code);
  if (visitor.cedula) url.searchParams.set('c', visitor.cedula);
  if (visitor.firstName) url.searchParams.set('fn', visitor.firstName);
  if (visitor.lastName) url.searchParams.set('ln', visitor.lastName);
  if (visitor.department) url.searchParams.set('d', visitor.department);
  if (visitor.hostName) url.searchParams.set('h', visitor.hostName);
  if (visitor.companyName) url.searchParams.set('co', visitor.companyName);
  if (visitor.notes) url.searchParams.set('n', visitor.notes);
  if (visitor.checkInTime) url.searchParams.set('t', visitor.checkInTime);
  if (visitor.checkOutTime) url.searchParams.set('out', visitor.checkOutTime);
  if (visitor.status) url.searchParams.set('s', visitor.status);

  return url.toString();
}

/**
 * Finds a visitor in a list by credentialCode, cedula (with or without dashes), or id.
 */
export function findVisitorByCodeOrCedula(visitors: Visitor[], query: string): Visitor | undefined {
  if (!query || !query.trim()) return undefined;
  const cleanQuery = query.trim().toLowerCase();
  const digitsOnlyQuery = cleanQuery.replace(/\D/g, '');

  return visitors.find((v) => {
    // 1. Direct match with credentialCode
    if (v.credentialCode && v.credentialCode.toLowerCase() === cleanQuery) {
      return true;
    }
    // 2. Direct match with ID
    if (v.id.toLowerCase() === cleanQuery) {
      return true;
    }
    // 3. Match with Cédula (exact string)
    if (v.cedula && v.cedula.toLowerCase() === cleanQuery) {
      return true;
    }
    // 4. Match with Cédula (digits only, e.g. 00101369312 vs 001-0136931-2)
    if (digitsOnlyQuery.length >= 6 && v.cedula) {
      const vDigits = v.cedula.replace(/\D/g, '');
      if (vDigits === digitsOnlyQuery) {
        return true;
      }
    }
    return false;
  });
}
