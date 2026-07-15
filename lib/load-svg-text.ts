import { Asset } from 'expo-asset';
import { Image } from 'react-native';

export async function loadSvgText(source: number): Promise<string> {
  const asset = Asset.fromModule(source);

  if (!asset.downloaded) {
    await asset.downloadAsync();
  }

  const uri = asset.localUri ?? asset.uri;

  if (uri) {
    const response = await fetch(uri);

    if (response.ok) {
      return response.text();
    }
  }

  const resolved = Image.resolveAssetSource(source);

  if (!resolved?.uri) {
    throw new Error('Unable to resolve SVG asset URI');
  }

  const fallbackResponse = await fetch(resolved.uri);

  if (!fallbackResponse.ok) {
    throw new Error(`Failed to load SVG asset (${fallbackResponse.status})`);
  }

  return fallbackResponse.text();
}
