import { SerializeOptions } from '@n4it/crud';
import { DeleteDeviceResponseDto } from './delete-device-response.dto';

export const serialize: SerializeOptions = {
  delete: DeleteDeviceResponseDto,
};
