import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Cargar variables de entorno
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'case-documents';
const outputDir = path.resolve(process.cwd(), 'backups/storage');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function downloadBucketFiles() {
  console.log(`📦 [BACKUP STORAGE] Iniciando respaldo del bucket "${bucketName}"...`);
  fs.mkdirSync(outputDir, { recursive: true });

  // Listar carpetas / casos en el bucket
  const { data: rootItems, error: rootError } = await supabase.storage
    .from(bucketName)
    .list('', { limit: 1000 });

  if (rootError) {
    console.error('❌ Error listando el bucket:', rootError.message);
    process.exit(1);
  }

  let totalDownloaded = 0;

  for (const item of rootItems) {
    if (item.id === null) {
      // Es una subcarpeta (case_id)
      const folderName = item.name;
      const { data: files, error: filesError } = await supabase.storage
        .from(bucketName)
        .list(folderName, { limit: 1000 });

      if (!filesError && files) {
        for (const file of files) {
          const filePath = `${folderName}/${file.name}`;
          const localCaseDir = path.join(outputDir, folderName);
          fs.mkdirSync(localCaseDir, { recursive: true });
          const localFilePath = path.join(localCaseDir, file.name);

          console.log(`⬇️ Descargando: ${filePath}...`);
          const { data: blob, error: downloadError } = await supabase.storage
            .from(bucketName)
            .download(filePath);

          if (!downloadError && blob) {
            const buffer = Buffer.from(await blob.arrayBuffer());
            fs.writeFileSync(localFilePath, buffer);
            totalDownloaded += 1;
          } else {
            console.warn(`⚠️ Error descargando ${filePath}:`, downloadError?.message);
          }
        }
      }
    } else {
      // Archivo en la raíz del bucket
      const filePath = item.name;
      const localFilePath = path.join(outputDir, item.name);
      console.log(`⬇️ Descargando archivo raíz: ${filePath}...`);
      const { data: blob, error: downloadError } = await supabase.storage
        .from(bucketName)
        .download(filePath);

      if (!downloadError && blob) {
        const buffer = Buffer.from(await blob.arrayBuffer());
        fs.writeFileSync(localFilePath, buffer);
        totalDownloaded += 1;
      }
    }
  }

  console.log(`🎉 [BACKUP STORAGE] Finalizado: ${totalDownloaded} archivo(s) respaldados en "${outputDir}".`);
}

downloadBucketFiles().catch(console.error);
