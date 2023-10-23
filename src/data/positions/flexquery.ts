const ERROR_CODES = {
  '1001':
    'Statement could not be generated at this time. Please try again shortly.',
  '1003': 'Statement is not available.',
  '1004': 'Statement is incomplete at this time. Please try again shortly.',
  '1005':
    'Settlement data is not ready at this time. Please try again shortly.',
  '1006': 'FIFO P/L data is not ready at this time. Please try again shortly.',
  '1007': 'MTM P/L data is not ready at this time. Please try again shortly.',
  '1008':
    'MTM and FIFO P/L data is not ready at this time. Please try again shortly.',
  '1009':
    'The server is under heavy load. Statement could not be generated at this time. Please try again shortly.',
  '1010':
    'Legacy Flex Queries are no longer supported. Please convert over to Activity Flex.',
  '1011': 'Service account is inactive.',
  '1012': 'Token has expired.',
  '1013': 'IP restriction.',
  '1014': 'Query is invalid.',
  '1015': 'Token is invalid.',
  '1016': 'Account in invalid.',
  '1017': 'Reference code is invalid.',
  '1018':
    'Too many requests have been made from this token. Please try again shortly.',
  '1019': 'Statement generation in progress. Please try again shortly.',
  '1020': 'Invalid request or unable to validate request.',
  '1021':
    'Statement could not be retrieved at this time. Please try again shortly. ',
};

export interface FlexQueryParams {
  token: string;
  query_id: string;
}

type FlexQueryResponse =
  | {
      Status: 'Success';
      [key: string]: string | null;
    }
  | {
      Status: string;
      ErrorCode: keyof typeof ERROR_CODES;
      ErrorMessage: string;
    };

interface FlexStatementParams {
  token: string;
  reference_code: string;
}

async function _xmlToJSON<TPayload extends Record<string, string | null>>(
  resp: Response
): Promise<TPayload> {
  const xml = new DOMParser().parseFromString(await resp.text(), 'text/xml');
  return Object.fromEntries(
    Array.from(xml.querySelectorAll(':root > *')).map((elm) => [
      elm.tagName,
      elm.textContent,
    ])
  ) as TPayload;
}

async function _fetchStatement(
  { token, reference_code }: FlexStatementParams,
  attempts: number = 1
): Promise<Blob> {
  const resp = await fetch(
    `/flex/Universal/servlet/FlexStatementService.GetStatement?t=${token}&q=${reference_code}&v=3`
  );
  if (!resp.ok) {
    throw new Error(await resp.text());
  }
  if (resp.headers.get('content-type') === 'text/plain') {
    return await resp.blob();
  }

  const { Status, ...payload } = await _xmlToJSON<FlexQueryResponse>(resp);
  if (attempts > 3) {
    throw new Error(
      ERROR_CODES[payload.ErrorCode as keyof typeof ERROR_CODES] ||
        (payload.ErrorMessage as string)
    );
  }

  await new Promise((res, _rej) => setTimeout(res, 10 ** attempts));
  return await _fetchStatement({ token, reference_code }, attempts + 1);
}

export async function fileFromFlexQuery({
  token,
  query_id,
}: FlexQueryParams): Promise<Blob> {
  const resp = await fetch(
    `/flex/Universal/servlet/FlexStatementService.SendRequest?t=${token}&q=${query_id}&v=3`
  );
  if (!resp.ok) {
    throw new Error(await resp.text());
  }
  const payload = await _xmlToJSON<Record<string, string | null>>(resp);
  if (payload.Status !== 'Success') {
    throw new Error(payload.ErrorMessage ?? 'Unknown error');
  }
  return await _fetchStatement({
    token,
    reference_code: payload.ReferenceCode!,
  });
}
