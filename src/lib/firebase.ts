/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

export const app = initializeApp(config);

export const db = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

export default db;
