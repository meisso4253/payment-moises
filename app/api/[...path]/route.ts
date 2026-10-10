import { createStudyApi } from '../../../lib/study-api';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const { GET, POST, PUT } = createStudyApi();
