<?php

namespace Tests\Feature;

use App\Support\SecureFile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SecureFileTest extends TestCase
{
    use RefreshDatabase;

    public function test_uploaded_file_is_encrypted_at_rest_and_reads_back(): void
    {
        Storage::fake('local');
        $file = UploadedFile::fake()->createWithContent('contract.pdf', 'TOP SECRET CONTRACT');

        $path = SecureFile::storeUpload($file, 'staff/1');

        $onDisk = Storage::disk('local')->get($path);
        $this->assertStringStartsWith('VENC1:', $onDisk);
        $this->assertStringNotContainsString('TOP SECRET CONTRACT', $onDisk); // ciphertext on disk
        $this->assertSame('TOP SECRET CONTRACT', SecureFile::read($path)); // transparently decrypts
    }

    public function test_legacy_plaintext_files_still_read(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('staff/1/old.txt', 'plain legacy file');

        $this->assertSame('plain legacy file', SecureFile::read('staff/1/old.txt'));
    }

    public function test_encrypt_existing_is_idempotent(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('cv.pdf', 'CV BODY');

        SecureFile::encryptExisting('cv.pdf');
        $first = Storage::disk('local')->get('cv.pdf');
        SecureFile::encryptExisting('cv.pdf'); // second call must not double-encrypt
        $second = Storage::disk('local')->get('cv.pdf');

        $this->assertSame($first, $second);
        $this->assertSame('CV BODY', SecureFile::read('cv.pdf'));
    }

    public function test_download_returns_decrypted_bytes_with_a_filename(): void
    {
        Storage::fake('local');
        $path = SecureFile::storeUpload(UploadedFile::fake()->createWithContent('x.pdf', 'BYTES'), 'finance/receipts');

        $res = SecureFile::download($path, 'receipt-7.pdf');

        $this->assertSame('BYTES', $res->getContent());
        $this->assertStringContainsString('receipt-7.pdf', $res->headers->get('Content-Disposition'));
    }
}
