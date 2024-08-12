import axios from 'axios';
import cf from '../../config';

export default axios.create({
  auth: cf.auth
});