import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { DentistaService } from './dentista';

describe('DentistaService', () => {
  let service: DentistaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(DentistaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
