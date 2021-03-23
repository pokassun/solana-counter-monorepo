import 'isomorphic-unfetch';

import dotenv from 'dotenv';
import nock from 'nock';

dotenv.config({ path: '.env.test' });

afterAll(() => {
  nock.cleanAll();
  nock.restore();
});
